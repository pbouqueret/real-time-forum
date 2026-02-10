import { state, checkAuth, updateNavbar } from '../app.js';

export function navigate(path) {
    window.location.hash = path;
}

// Pages that don't require authentication
const publicRoutes = ['/login', '/register'];

export async function handleRoute() {
    const path = window.location.hash.slice(1) || '/';
    const app = document.getElementById('app');

    // Check auth on every route change
    await checkAuth();
    updateNavbar();

    // Route guard: redirect to login if not authenticated and route is protected
    const isPublic = publicRoutes.includes(path) || publicRoutes.some(r => path.startsWith(r));
    if (!state.isAuthenticated && !isPublic) {
        window.location.hash = '#/login';
        return;
    }

    // Redirect away from auth pages if already logged in
    if (state.isAuthenticated && publicRoutes.includes(path)) {
        window.location.hash = '#/';
        return;
    }

    // Route to the correct page
    if (path === '/') {
        import('../pages/feed.js').then(module => module.render(app));
    } else if (path === '/login') {
        import('../pages/login.js').then(module => module.render(app));
    } else if (path === '/register') {
        import('../pages/register.js').then(module => module.render(app));
    } else if (path === '/chat') {
        import('../pages/chat.js').then(module => module.render(app));
    } else if (path.startsWith('/post/')) {
        const postId = path.split('/')[2];
        import('../pages/post.js').then(module => module.render(app, postId));
    } else {
        app.innerHTML = '<div class="container"><h2>404 - Page Not Found</h2></div>';
    }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
