import React from 'react'
import Home from './pages/Home'
import Auth from './pages/Auth'
import {Routes,Route} from 'react-router-dom'
import { AuthContext } from './context/AuthContext'
import { useContext } from 'react'
import { Navigate } from 'react-router-dom'


const App = () => {
  const { currentUser } = useContext(AuthContext)

  return (
    <Routes>
      <Route path="/" element={<Home/> } />
      <Route path="/auth" element={currentUser? <Navigate to="/" /> : <Auth/>}/>
      

      
    </Routes>
  )
}

export default App
