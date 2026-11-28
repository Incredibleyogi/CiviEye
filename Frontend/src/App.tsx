import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PostsProvider } from "@/contexts/PostsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SocketProvider } from "@/contexts/SocketContext";
import Index from "./pages/Index"; import Signup from "./pages/Signup"; import Login from "./pages/Login"; import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard"; import Profile from "./pages/Profile"; import CreatePost from "./pages/CreatePost"; import Search from "./pages/Search";
import Notifications from "./pages/Notifications"; import NotFound from "./pages/NotFound"; import UserProfile from "./pages/UserProfile"; import AdminManagement from "./pages/AdminManagement";
const queryClient = new QueryClient();
function LoadingScreen(){return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/></div>}
function ProtectedRoute({children}:{children:React.ReactNode}){const {isAuthenticated,loading}=useAuth();if(loading)return <LoadingScreen/>;return isAuthenticated?<>{children}</>:<Navigate to="/login" replace/>}
function PublicRoute({children}:{children:React.ReactNode}){const {isAuthenticated,loading}=useAuth();if(loading||!isAuthenticated)return <>{children}</>;return <Navigate to="/dashboard" replace/>}
function RouteTable(){return <Routes>
<Route path="/" element={<PublicRoute><Index/></PublicRoute>}/><Route path="/signup" element={<PublicRoute><Signup/></PublicRoute>}/><Route path="/login" element={<PublicRoute><Login/></PublicRoute>}/><Route path="/forgot-password" element={<PublicRoute><ForgotPassword/></PublicRoute>}/>
<Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/><Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>}/><Route path="/create" element={<ProtectedRoute><CreatePost/></ProtectedRoute>}/><Route path="/search" element={<ProtectedRoute><Search/></ProtectedRoute>}/><Route path="/notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>}/><Route path="/user/:userId" element={<ProtectedRoute><UserProfile/></ProtectedRoute>}/><Route path="/admin/management" element={<ProtectedRoute><AdminManagement/></ProtectedRoute>}/><Route path="*" element={<NotFound/>}/></Routes>}
function AuthenticatedProviders({children}:{children:React.ReactNode}){return <SocketProvider><PostsProvider><NotificationsProvider>{children}</NotificationsProvider></PostsProvider></SocketProvider>}
function AppRoutes(){const {isAuthenticated}=useAuth();const routes=<RouteTable/>;return isAuthenticated?<AuthenticatedProviders>{routes}</AuthenticatedProviders>:routes}
const App=()=> <QueryClientProvider client={queryClient}><TooltipProvider><Toaster/><Sonner/><BrowserRouter><AuthProvider><AppRoutes/></AuthProvider></BrowserRouter></TooltipProvider></QueryClientProvider>;
export default App;