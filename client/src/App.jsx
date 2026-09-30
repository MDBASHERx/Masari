import { Routes, Route, Link } from "react-router";
import { getLocale } from "./locales/locale.js";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import Profile from "./pages/profile/Profile.jsx";
import Assessment from "./pages/assessment/Assessment.jsx";
import LearningPath from "./pages/learningPath/LearningPath.jsx";

function App() 
{
    const locale = getLocale();

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/learning-path" element={<LearningPath />} />
            </Route>

        <Route path="*" element={
            <main className="container">
                <h1>{locale.page404.title}</h1>
                <Link to="/">{locale.all.backHome}</Link>
            </main>
        }/>
        </Routes>
    );
}

export default App;