import { useEffect, useState } from "react"
import axios from "axios"

function App() {
  const [jokes, setJokes] = useState([])
  useEffect(() => {
    axios.get('/api/jokes')
    .then((res) => {
      setJokes(res.data)
    })
    .catch((err) => {
      console.log(err);      
    })
  })  
  
  return (
    <>
      <div>
        <h1 className="text-sky-500">hello frontend</h1>
        <p>Jokes: {jokes.length}</p>

        {
          jokes.map((joke, index) => (
            <div key={joke}></div>
          ))
        }
      </div>
    </>
  )
}

export default App