import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PostsPage } from './pages/PostsPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PostFormPage } from './pages/PostFormPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyProfilePage } from './pages/MyProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Navigate to="/posts" replace />} />
                    <Route path="login" element={<LoginPage />} />
                    <Route path="register" element={<RegisterPage />} />

                    {/*
                     * Everything else needs a session, because the API's
                     * AuthGuard is global and only /auth/register and
                     * /auth/login carry @Public(). Reads are guarded too, so
                     * a "browse without an account" route would render a
                     * screen that can only ever show a 401.
                     */}
                    <Route element={<RequireAuth />}>
                        <Route path="posts" element={<PostsPage />} />
                        <Route path="posts/new" element={<PostFormPage />} />
                        <Route path="posts/:id" element={<PostDetailPage />} />
                        <Route
                            path="posts/:id/edit"
                            element={<PostFormPage />}
                        />
                        <Route path="profiles" element={<ProfilesPage />} />
                        <Route
                            path="profiles/:id"
                            element={<ProfilePage />}
                        />
                        <Route path="me" element={<MyProfilePage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}
