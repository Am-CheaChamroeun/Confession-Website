document.addEventListener('DOMContentLoaded', function() {
    const confessionForm = document.getElementById('confessionForm');
    const confessionText = document.getElementById('confession-text');
    const charCount = document.getElementById('char-count');
    const successMessage = document.getElementById('success-message');
    const sendAnotherBtn = document.getElementById('send-another');

    confessionText.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;
        
        if (currentLength > 800) {
            charCount.style.color = '#ff6b6b';
        } else if (currentLength > 600) {
            charCount.style.color = '#ffa726';
        } else {
            charCount.style.color = '#666';
        }
    });

    confessionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const confession = formData.get('confession').trim();
        const category = formData.get('category');
        
        if (!confession) {
            showNotification('Please write your confession before submitting.', 'error');
            return;
        }
        
        if (confession.length < 10) {
            showNotification('Your confession seems a bit short. Please share more if you feel comfortable.', 'warning');
            return;
        }
        
        const submitBtn = this.querySelector('.submit-btn');
        submitBtn.style.opacity = '0.7';
        submitBtn.style.transform = 'scale(0.98)';
        submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        submitBtn.disabled = true;
        
        const confessionData = {
            id: generateId(),
            confession: confession,
            category: category || 'uncategorized',
            timestamp: new Date().toISOString(),
            recipient: 'B Kosal'
        };
        
        saveConfession(confessionData)
            .then(() => {
                setTimeout(() => {
                    showSuccessMessage();
                    this.reset();
                    charCount.textContent = '0';
                    charCount.style.color = '#666';
                    
                    submitBtn.style.opacity = '1';
                    submitBtn.style.transform = 'scale(1)';
                    submitBtn.querySelector('.btn-text').textContent = 'Send Anonymous Confession';
                    submitBtn.disabled = false;
                }, 500);
            })
            .catch((error) => {
                console.error('Error saving confession:', error);
                showNotification('Failed to send confession. Please try again.', 'error');
                
                submitBtn.style.opacity = '1';
                submitBtn.style.transform = 'scale(1)';
                submitBtn.querySelector('.btn-text').textContent = 'Send Anonymous Confession';
                submitBtn.disabled = false;
            });
    });
    
    sendAnotherBtn.addEventListener('click', function() {
        successMessage.classList.add('hidden');
        confessionText.focus();
        
        document.querySelector('.confession-form-container').scrollIntoView({
            behavior: 'smooth'
        });
    });
    
    function generateId() {
        return 'confession_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async function saveConfession(data) {
        try {
            const response = await fetch('/api/confessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save confession');
            }
            
            const result = await response.json();
            
            const event = new CustomEvent('newConfession', { detail: result.confession });
            window.dispatchEvent(event);
            
            return result;
        } catch (error) {
            console.error('Error saving confession:', error);
            throw error;
        }
    }
    
    function showSuccessMessage() {
        successMessage.classList.remove('hidden');
        successMessage.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
        });
        
        setTimeout(() => {
            successMessage.querySelector('.success-content').style.animation = 'pulse 2s ease-in-out infinite';
        }, 500);
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'error' ? '�' : type === 'warning' ? '=�' : '9'}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffa726' : '#667eea'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            font-family: inherit;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .notification-icon {
            font-size: 1.2rem;
        }
        
        .notification-message {
            font-size: 0.9rem;
            line-height: 1.4;
        }
    `;
    document.head.appendChild(style);
    
    window.getConfessions = async function() {
        try {
            const response = await fetch('/api/confessions');
            if (!response.ok) {
                throw new Error('Failed to fetch confessions');
            }
            const data = await response.json();
            return data.confessions || [];
        } catch (error) {
            console.error('Error fetching confessions:', error);
            return [];
        }
    };
    
    window.clearConfessions = function() {
        try {
            localStorage.removeItem('confessions');
            console.log('All confessions cleared');
        } catch {
            console.log('Unable to clear confessions');
        }
    };
    
    const stars = document.querySelector('.stars');
    if (stars) {
        stars.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            this.style.background = `
                radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.3) 0%, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='nonzero'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3Ccircle cx='33' cy='5' r='1'/%3E%3Ccircle cx='3' cy='23' r='1'/%3E%3Ccircle cx='43' cy='23' r='1'/%3E%3Ccircle cx='23' cy='33' r='1'/%3E%3Ccircle cx='53' cy='43' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
            `;
        });
        
        stars.addEventListener('mouseleave', function() {
            this.style.background = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='nonzero'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3Ccircle cx='33' cy='5' r='1'/%3E%3Ccircle cx='3' cy='23' r='1'/%3E%3Ccircle cx='43' cy='23' r='1'/%3E%3Ccircle cx='23' cy='33' r='1'/%3E%3Ccircle cx='53' cy='43' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;
        });
    }

    // Public confessions functionality
    const confessionsList = document.getElementById('confessions-list');
    const totalConfessionsSpan = document.getElementById('total-confessions');
    const todayConfessionsSpan = document.getElementById('today-confessions');

    // Load confessions when page loads
    loadConfessions();

    async function loadConfessions() {
        try {
            const confessions = await getConfessions();
            updateStats(confessions);
            displayConfessions(confessions);
        } catch (error) {
            console.error('Error loading confessions:', error);
            displayConfessions([]);
        }
    }

    function updateStats(confessions) {
        totalConfessionsSpan.textContent = confessions.length;
        
        const today = new Date().toDateString();
        const todayCount = confessions.filter(confession => 
            new Date(confession.timestamp).toDateString() === today
        ).length;
        todayConfessionsSpan.textContent = todayCount;
    }

    function displayConfessions(confessions) {
        if (confessions.length === 0) {
            confessionsList.innerHTML = `
                <div class="no-confessions">
                    <p>📭 No confessions yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const confessionsHtml = confessions.map(confession => {
            const date = new Date(confession.timestamp);
            const timeAgo = getTimeAgo(date);
            const categoryBadge = confession.category && confession.category !== 'uncategorized' 
                ? `<span class="category-badge ${confession.category}">${confession.category}</span>` 
                : '';

            return `
                <div class="confession-item">
                    <div class="confession-header">
                        <div class="confession-meta">
                            <span class="confession-id">#${confession.id.split('_')[1]}</span>
                            ${categoryBadge}
                        </div>
                        <div class="confession-time" title="${date.toLocaleString()}">
                            ${timeAgo}
                        </div>
                    </div>
                    <div class="confession-content">
                        <p>${confession.confession}</p>
                    </div>
                </div>
            `;
        }).join('');

        confessionsList.innerHTML = confessionsHtml;
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return date.toLocaleDateString();
    }

    // Listen for new confessions and update display
    window.addEventListener('newConfession', function() {
        loadConfessions();
    });
});