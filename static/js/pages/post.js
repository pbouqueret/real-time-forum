import { navigate } from '../utils/router.js';
import { state } from '../app.js';

export async function render(container, postId) {
    container.innerHTML = '<div class="container"><div class="loading">Loading post...</div></div>';

    try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
            container.innerHTML = '<div class="container"><div class="error-message">Post not found</div></div>';
            return;
        }

        const post = await response.json();

        container.innerHTML = `
            <div class="container">
                <a href="#/" class="back-link">Back to feed</a>

                <article class="post-detail">
                    <div class="post-detail-header">
                        <span class="post-category-badge">${post.category}</span>
                        <span class="post-date">${formatDate(post.created_at)}</span>
                    </div>
                    <h2 class="post-detail-title">${post.title}</h2>
                    <p class="post-detail-author">by <strong>${post.author}</strong></p>
                    <div class="post-detail-content">${formatContent(post.content)}</div>
                </article>

                <section class="comments-section">
                    <h3>Comments</h3>
                    <form id="commentForm" class="comment-form">
                        <div class="form-group">
                            <textarea id="commentContent" placeholder="Write a comment..." rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary">Comment</button>
                        <div id="comment-error" class="error-message"></div>
                    </form>
                    <div id="commentsList" class="comments-list">
                        <div class="loading">Loading comments...</div>
                    </div>
                </section>
            </div>
        `;

        // Load comments
        await loadComments(postId);

        // Handle comment submit
        document.getElementById('commentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleCreateComment(postId);
        });

    } catch (error) {
        container.innerHTML = '<div class="container"><div class="error-message">Failed to load post</div></div>';
    }
}

async function loadComments(postId) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (!response.ok) throw new Error('Failed to load comments');

        const comments = await response.json();

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="empty-state">No comments yet. Be the first to comment!</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-card">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${formatDate(comment.created_at)}</span>
                </div>
                <p class="comment-content">${comment.content}</p>
            </div>
        `).join('');

    } catch (error) {
        commentsList.innerHTML = '<div class="error-message">Failed to load comments</div>';
    }
}

async function handleCreateComment(postId) {
    const content = document.getElementById('commentContent').value.trim();
    const errorDiv = document.getElementById('comment-error');

    errorDiv.textContent = '';

    if (!content) {
        errorDiv.textContent = 'Comment cannot be empty';
        return;
    }

    try {
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
        });

        if (response.ok) {
            document.getElementById('commentContent').value = '';
            await loadComments(postId);
        } else {
            const text = await response.text();
            errorDiv.textContent = text || 'Failed to create comment';
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

function formatContent(content) {
    return content.replace(/\n/g, '<br>');
}
