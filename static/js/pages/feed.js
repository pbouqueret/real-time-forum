import { navigate } from '../utils/router.js';
import { state } from '../app.js';

let currentCategory = '';

export async function render(container) {
    container.innerHTML = `
        <div class="container">
            <div class="feed-header">
                <h2>Forum</h2>
                <button id="newPostBtn" class="btn-primary">New Post</button>
            </div>

            <div id="categoryFilters" class="category-filters">
                <button class="category-btn active" data-category="">All</button>
            </div>

            <div id="newPostForm" class="new-post-form hidden">
                <form id="createPostForm">
                    <div class="form-group">
                        <input type="text" id="postTitle" placeholder="Post title" required>
                    </div>
                    <div class="form-group">
                        <textarea id="postContent" placeholder="What's on your mind?" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <select id="postCategory" required>
                            <option value="">Select a category</option>
                            <option value="General">General</option>
                            <option value="Technology">Technology</option>
                            <option value="Help">Help</option>
                            <option value="Off-Topic">Off-Topic</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Post</button>
                        <button type="button" id="cancelPost" class="btn-secondary">Cancel</button>
                    </div>
                    <div id="post-error" class="error-message"></div>
                </form>
            </div>

            <div id="postsList" class="posts-list">
                <div class="loading">Loading posts...</div>
            </div>
        </div>
    `;

    // Toggle new post form
    document.getElementById('newPostBtn').addEventListener('click', () => {
        document.getElementById('newPostForm').classList.toggle('hidden');
    });

    document.getElementById('cancelPost').addEventListener('click', () => {
        document.getElementById('newPostForm').classList.add('hidden');
    });

    // Create post
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);

    // Load categories and posts
    await loadCategories();
    await loadPosts();
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            const categories = await response.json();
            const filtersDiv = document.getElementById('categoryFilters');
            if (!filtersDiv) return;

            let html = '<button class="category-btn active" data-category="">All</button>';
            categories.forEach(cat => {
                html += `<button class="category-btn" data-category="${cat}">${cat}</button>`;
            });
            filtersDiv.innerHTML = html;

            filtersDiv.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    filtersDiv.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    currentCategory = e.target.dataset.category;
                    loadPosts();
                });
            });
        }
    } catch (e) {
        // Ignore category load errors
    }
}

async function loadPosts() {
    const postsList = document.getElementById('postsList');
    if (!postsList) return;

    try {
        let url = '/api/posts';
        if (currentCategory) {
            url += `?category=${encodeURIComponent(currentCategory)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load posts');

        const posts = await response.json();

        if (posts.length === 0) {
            postsList.innerHTML = '<div class="empty-state">No posts yet. Be the first to post!</div>';
            return;
        }

        postsList.innerHTML = posts.map(post => `
            <article class="post-card" data-id="${post.id}">
                <div class="post-card-header">
                    <span class="post-author">${post.author}</span>
                    <span class="post-date">${formatDate(post.created_at)}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-preview">${truncate(post.content, 150)}</p>
                <div class="post-card-footer">
                    <span class="post-category-badge">${post.category}</span>
                    <a href="#/post/${post.id}" class="post-read-more">Read more</a>
                </div>
            </article>
        `).join('');

    } catch (error) {
        postsList.innerHTML = '<div class="error-message">Failed to load posts</div>';
    }
}

async function handleCreatePost(e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const category = document.getElementById('postCategory').value;
    const errorDiv = document.getElementById('post-error');

    errorDiv.textContent = '';

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, category }),
        });

        if (response.ok) {
            document.getElementById('createPostForm').reset();
            document.getElementById('newPostForm').classList.add('hidden');
            await loadCategories();
            await loadPosts();
        } else {
            const text = await response.text();
            errorDiv.textContent = text || 'Failed to create post';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(str, max) {
    if (str.length <= max) return str;
    return str.substring(0, max) + '...';
}
