// import { useEffect, useState } from 'react'
// import iit from '/iit.png'
// import logo from '/logo.svg'
// import './App.css'
// import './assets/style.css'

// function App() {
//   const [imageZIndex, setImageZIndex] = useState(10);

//   const [isSignInEmailMode, setIsSignInEmailMode] = useState(true);
//   const [isSignUpEmailMode, setIsSignUpEmailMode] = useState(true);

//   async function fetchData() {
//     const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/');
//   }

//   const toggleSignInMode = () => setIsSignInEmailMode(prev => !prev);
//   const toggleSignUpMode = () => setIsSignUpEmailMode(prev => !prev);


//   useEffect(() => {
//     fetchData();
//   }, [])

//   useEffect(() => {
//     const container = document.querySelector('.container');
//     const signUpButton = document.getElementById('sign-up-btn');
//     const signInButton = document.getElementById('sign-in-btn');

//     if (container && signUpButton && signInButton) {
//       const handleSignUpClick = () => {
//         container.classList.add('sign-up-mode');
//         setImageZIndex(1);
//         setIsSignInEmailMode(true);
//         setIsSignUpEmailMode(true);
//       };

//       const handleSignInClick = () => {
//         container.classList.remove('sign-up-mode');
//         setImageZIndex(10);
//         setIsSignInEmailMode(true);
//         setIsSignUpEmailMode(true);
//       };

//       signUpButton.addEventListener('click', handleSignUpClick);
//       signInButton.addEventListener('click', handleSignInClick);

//       return () => {
//         signUpButton.removeEventListener('click', handleSignUpClick);
//         signInButton.removeEventListener('click', handleSignInClick);
//       };
//     }
//   }, []);

//   return (<>
//     <div className="container">
//       <div className="forms-container">
//         <div className="signin-signup">
//           <form action="#" className="sign-in-form">
//             <h2 className="title">
//               {isSignInEmailMode ? 'Sign in Using Email' : 'Sign in with IITD'}
//             </h2>

//             {isSignInEmailMode ? (
//               <>
//                 <div className="input-field">
//                   <i className="fas fa-user"></i>
//                   <input type="text" placeholder="Username" />
//                 </div>
//                 <div className="input-field">
//                   <i className="fas fa-lock"></i>
//                   <input type="password" placeholder="Password" />
//                 </div>
//                 <input type="submit" value="Login" className="btn solid" />
//                 <p className="social-text">Or Sign in with IITD </p>
//               </>
//             ) : (
//               <>
//                 <input type="submit" value="Login via IITD" className="btn solid" />
//                 <p className="social-text iitd-note">Don't use your Kerberos ID here</p>
//                 <p className="social-text">Or Sign in using Email</p>
//               </>
//             )}

//             <div className="social-media">
//               <a href="#" className="social-icon" onClick={toggleSignInMode}>
//                 <img src={logo} className='iit-logo' alt="IITD Logo" />
//               </a>
//             </div>
//           </form>

//           <form action="#" className="sign-up-form">
//             <h2 className="title">
//               {isSignUpEmailMode ? 'Sign up Using Email' : 'Sign up with IITD'}
//             </h2>

//             {isSignUpEmailMode ? (
//               <>
//                 <div className="input-field">
//                   <i className="fas fa-user"></i>
//                   <input type="text" placeholder="Username" />
//                 </div>
//                 <div className="input-field">
//                   <i className="fas fa-envelope"></i>
//                   <input type="email" placeholder="Email" />
//                 </div>
//                 <div className="input-field">
//                   <i className="fas fa-lock"></i>
//                   <input type="password" placeholder="Password" />
//                 </div>
//                 <input type="submit" className="btn" value="Sign up" />
//                 <p className="social-text">Or Sign up with IITD</p>
//               </>
//             ) : (
//               <>
//                 <input type="submit" value="Register via IITD" className="btn solid" />
//                 <p className="social-text iitd-note">Don't use your Kerberos ID here</p>
//                 <p className="social-text">Or Sign up using Email</p>
//               </>
//             )}

//             <div className="social-media">
//               <a href="#" className="social-icon" onClick={toggleSignUpMode}>
//                 <img src={logo} className='iit-logo' alt="IITD Logo" />
//               </a>
//             </div>
//           </form>
//         </div>
//       </div>

//       <div className="panels-container">
//         <img
//           src={iit}
//           className="image"
//           alt=""
//           style={{ zIndex: imageZIndex }}
//         />
//         <div className="panel left-panel">
//           <div className="content">
//             <h3>New here ?</h3>
//             <p>
//               Enter your details and start your journey with us
//             </p>
//             <button className="btn transparent" id="sign-up-btn">
//               Sign up
//             </button>
//           </div>
//         </div>
//         <div className="panel right-panel">
//           <div className="content">
//             <h3>One of us ?</h3>
//             <p>
//               To keep connected with us please login with your personal info
//             </p>
//             <button className="btn transparent" id="sign-in-btn">
//               Sign in
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   </>)
// }

// export default App

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Secure from "./pages/Secure";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/secure" element={<Secure />} />
      </Routes>
  );
}

export default App;