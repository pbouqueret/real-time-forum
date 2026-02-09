export function navigate(path) {
    window.location.hash = path;
    handleRoute();
}

export function handleRoute() {
    const path = window.location.hash.slice(1) || '/';
    const app = document.getElementById('app');

    // Simple routing logic
    if (path === '/') {
        // Show Home/Forum
        import('../pages/home.js').then(module => module.render(app));
    } else if (path === '/login') {
        import('../pages/login.js').then(module => module.render(app));
    } else if (path === '/register') {
        import('../pages/register.js').then(module => module.render(app));
    } else {
        app.innerHTML = '<h1>404 - Page Not Found</h1>';
    }
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
