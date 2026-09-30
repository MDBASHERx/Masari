import AmbientBackground from "./components/design/AmbientBackground.jsx";
import SiteHeader from "./components/design/SiteHeader.jsx";
import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router";
import { getLocale } from "./locales/locale.js";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
const Home = lazy(() => import("./pages/Home.jsx"));
const Login = lazy(() => import("./pages/auth/Login.jsx"));
const Register = lazy(() => import("./pages/auth/Register.jsx"));
const Profile = lazy(() => import("./pages/profile/Profile.jsx"));
const Assessment = lazy(() => import("./pages/assessment/Assessment.jsx"));
const LearningPath = lazy(() => import("./pages/learningPath/LearningPath.jsx"));
const Chat = lazy(() => import("./pages/Chat.jsx"));
const CareerExploration = lazy(() => import("./pages/CareerExploration.jsx"));
const Grades = lazy(() => import("./pages/grades/Grades.jsx"));
const Progress = lazy(() => import("./pages/progress/Progress.jsx"));

function App() 
{
    const locale = getLocale();

    return (
        <>
        <AmbientBackground />
        <SiteHeader />
        <Suspense fallback={<main className="container" role="status">{locale.all.loading}</main>}>
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/assessment" element={<Assessment />} />
                <Route path="/learning-path" element={<LearningPath />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/future" element={<CareerExploration />} />
                <Route path="/grades" element={<Grades />} />
                <Route path="/progress" element={<Progress />} />
            </Route>

        <Route path="*" element={
            <main className="container">
                <h1>{locale.page404.title}</h1>
                <Link to="/">{locale.all.backHome}</Link>
            </main>
        }/>
        </Routes>
        </Suspense>
        </>
    );
}

export default App;
