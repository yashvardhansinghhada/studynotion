import "./App.css";

// React Router
import {Route, Routes} from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UpdatePassword from "./pages/UpdatePassword";
import VerifyEmail from "./pages/VerifyEmail";


// Components
import Navbar from "./components/common/Navbar";
import OpenRoute from "./components/core/Auth/OpenRoute";
import ForgotPassword from "./pages/ForgetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Error from "./pages/Error";


import Catalog from './pages/Catalog';



function App() {

  // const dispatch = useDispatch()
  // const navigate = useNavigate()

  // const { user } = useSelector((state) => state.profile)
  // console.log('user............', user);

  // useEffect(() => {
  //   if (localStorage.getItem('token')) {
  //     const token = JSON.parse(localStorage.getItem('token'))
  //     dispatch(getUserDetails(token, navigate))
  //   }
  //   // eslint-disable-next-line 
  // }, [])
  
  return (
  <div className="w-screen min-h-screen bg-richblack-900 flex flex-col font-inter">
    <Navbar/>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path='/about' element={<About />} />
      <Route path='catalog/:catalogName' element={<Catalog/>} />
      <Route path="/contact" element={<Contact />} />
      {/* <Route path='courses/:courseId' element={<CourseDetails />} /> */}
      <Route
        path="signup"
        element={
          <OpenRoute>
            <Signup />
          </OpenRoute>
        }
      />

      <Route
        path="login"
        element={
          <OpenRoute>
            <Login />
          </OpenRoute>
        }
      />

      <Route
        path="forgot-password"
        element={
          <OpenRoute>
            <ForgotPassword />
          </OpenRoute>
        }
      />  

      <Route
        path="verify-email"
        element={
          <OpenRoute>
            <VerifyEmail />
          </OpenRoute>
        }
      />  

      <Route
        path="update-password/:id"
        element={
          <OpenRoute>
            <UpdatePassword />
          </OpenRoute>
        }
      />  

     
        
      <Route path="*" element={<Error />} />

    </Routes>

    </div>
  );
}

export default App;