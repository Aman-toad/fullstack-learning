import mongoose, {Schema} from 'mongoose'
import mongooseAggregatepaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema({
  videoFie: {
    type: String, //cloudinary url
    required: true,
  },
  thumbnail: {
    type: String, //cloudinary url
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    lowercase: true,    
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: trusted,
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {timestamps: true});

videoSchema.plugin(mongooseAggregatepaginate)

export const Video = mongoose.model('Video', videoSchema)