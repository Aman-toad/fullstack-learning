import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponst.js';
import { jwt } from JsonWebTokenError

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token !!")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation  -- not empty
  // check if user already exist: via username or email or both
  // check for images and avatar 
  // upload them to cloudinary
  // create user object - create entry db calls 
  // remove password and refresh token field from response
  // check for user creation 
  // return response


  //getting data
  const { fullname, username, email, password } = req.body;

  //checking validation
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required")
  }

  //checking if user exist
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, 'User with username or email already exist')
  }

  // console.log(req.files);

  //checking avatar or images
  const avatarLocalpath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //check avatar aya ki nahi
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required")
  }

  //uploading on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  //entry on database
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    username: username.toLowerCase(),
    email,
    password
  })

  //checking if user is created or not
  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  )

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registring the user')
  }

  //api res
  return res.status(201).json(
    new ApiResponse(200, createdUser, 'User Registred Successfully')
  )
});

// Login users
const loginUser = asyncHandler(async (req, res) => {
  //todo's to login the user

  //taking inputs from frontend
  //check if username email are not blank
  //check if the user exists if not suggest him/her to register
  //check the password
  //access and refresh token send to user
  //send cookies
  //shows welcome page

  const { email, username, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required")
  }

  // find either the username or email
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new ApiError(400, "User does not exist !!")
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password !!")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // sending cookies
  const options = {
    httpOnly: true,
    secure: false,// true in production
    // secure: process.env.NODE_ENV === "production", // true in production
    sameSite: "lax",
    path: "/"
  }

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200, {
        user: loggedInUser, accessToken, refreshToken
      },
        "user logged in successfully"
      )
    )
})

// logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  }

  res.clearCookie("accessToken", { ...options });
  res.clearCookie("refreshToken", { ...options });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request !!")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid Refresh Token !!")
    }
  
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Expired or used !!");    
    }
  
    const options = {
      httpsOnly: true,
      secure: true,
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshTokne: newRefreshToken},
        "Access Token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid Password !!")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200, {}, "Password changed Successfully !!"
    )
  )
})

const getCurrentUser = asyncHandler(async (req, res)=> {
  return res
  .status(200)
  .json(200, req.user, 'Current user fetched successfully !')
})

const updateAccountDetail = asyncHandler(async (req, res)=> {
  const {fullname, email} = req.body

  if(!fullname || !email){
    throw new ApiError(400, "all fields are required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname: fullname,
        email: email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully !!"))
})

const updateUserAvatar = asyncHandler(async (req, res)=> {
  //multer middleware
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading the files !")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Avatar updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res)=> {
  //multer middleware
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading the files !")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "cover image updated Successfully"))
})



export { registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, updateAccountDetail, updateUserAvatar, updateUserCoverImage}