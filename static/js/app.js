// API Base URL
const API_BASE = '/api/v1';

// Alpine.js App
function app() {
    return {
        // Navigation
        currentPage: 'dashboard',

        // Categories
        categories: [],

        // Transaction Form
        transactionForm: {
            category_id: '',
            amount: '',
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            memo: ''
        },
        editingTransaction: null,
        saving: false,

        // Delete
        deleteId: null,

        // Toast
        toastTitle: '',
        toastMessage: '',
        toastIcon: 'bi-info-circle',

        // Modals
        transactionModal: null,
        deleteModal: null,
        toast: null,

        // Computed
        get filteredCategories() {
            return this.categories.filter(c => c.type === this.transactionForm.type);
        },

        // Lifecycle
        async init() {
            // Initialize Bootstrap modals
            this.transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));
            this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
            this.toast = new bootstrap.Toast(document.getElementById('toast'));

            // Load categories
            await this.loadCategories();

            // Listen for HTMX events
            document.body.addEventListener('htmx:afterSwap', (e) => {
                // Re-initialize any components after HTMX swap
                this.initCharts();
            });
        },

        // Navigation
        navigate(page) {
            this.currentPage = page;
        },

        // Categories
        async loadCategories() {
            try {
                const res = await fetch(`${API_BASE}/categories`);
                const data = await res.json();
                this.categories = data.data || [];
            } catch (err) {
                console.error('Failed to load categories:', err);
                this.showToast('error', 'エラー', 'カテゴリの読み込みに失敗しました');
            }
        },

        // Transaction Modal
        showAddTransaction() {
            this.editingTransaction = null;
            this.transactionForm = {
                category_id: '',
                amount: '',
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                memo: ''
            };
            this.transactionModal.show();
        },

        showEditTransaction(transaction) {
            this.editingTransaction = transaction;
            this.transactionForm = {
                category_id: transaction.category_id,
                amount: transaction.amount,
                type: transaction.type,
                date: transaction.date.split('T')[0],
                memo: transaction.memo || ''
            };
            this.transactionModal.show();
        },

        async saveTransaction() {
            if (!this.transactionForm.category_id || !this.transactionForm.amount) {
                this.showToast('warning', '入力エラー', '必須項目を入力してください');
                return;
            }

            this.saving = true;

            try {
                const payload = {
                    category_id: parseInt(this.transactionForm.category_id),
                    amount: parseInt(this.transactionForm.amount),
                    type: this.transactionForm.type,
                    date: this.transactionForm.date,
                    memo: this.transactionForm.memo
                };

                let res;
                if (this.editingTransaction) {
                    res = await fetch(`${API_BASE}/transactions/${this.editingTransaction.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await fetch(`${API_BASE}/transactions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to save');
                }

                this.transactionModal.hide();
                this.showToast('success', '成功', this.editingTransaction ? '更新しました' : '登録しました');

                // Trigger HTMX refresh
                htmx.trigger(document.body, 'transactionsUpdated');

            } catch (err) {
                console.error('Failed to save transaction:', err);
                this.showToast('error', 'エラー', err.message || '保存に失敗しました');
            } finally {
                this.saving = false;
            }
        },

        // Delete
        showDeleteConfirm(id) {
            this.deleteId = id;
            this.deleteModal.show();
        },

        async confirmDelete() {
            if (!this.deleteId) return;

            try {
                const res = await fetch(`${API_BASE}/transactions/${this.deleteId}`, {
                    method: 'DELETE'
                });

                if (!res.ok) {
                    throw new Error('Failed to delete');
                }

                this.deleteModal.hide();
                this.showToast('success', '成功', '削除しました');

                // Trigger HTMX refresh
                htmx.trigger(document.body, 'transactionsUpdated');

            } catch (err) {
                console.error('Failed to delete:', err);
                this.showToast('error', 'エラー', '削除に失敗しました');
            } finally {
                this.deleteId = null;
            }
        },

        // Toast
        showToast(type, title, message) {
            this.toastTitle = title;
            this.toastMessage = message;

            switch (type) {
                case 'success':
                    this.toastIcon = 'bi-check-circle text-success';
                    break;
                case 'error':
                    this.toastIcon = 'bi-x-circle text-danger';
                    break;
                case 'warning':
                    this.toastIcon = 'bi-exclamation-circle text-warning';
                    break;
                default:
                    this.toastIcon = 'bi-info-circle text-info';
            }

            this.toast.show();
        },

        // Charts
        initCharts() {
            // Monthly chart
            const monthlyCanvas = document.getElementById('monthlyChart');
            if (monthlyCanvas && monthlyCanvas.dataset.income) {
                const ctx = monthlyCanvas.getContext('2d');
                const income = parseInt(monthlyCanvas.dataset.income) || 0;
                const expense = parseInt(monthlyCanvas.dataset.expense) || 0;

                // Destroy existing chart if any
                if (window.monthlyChart) {
                    window.monthlyChart.destroy();
                }

                window.monthlyChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['収入', '支出'],
                        datasets: [{
                            data: [income, expense],
                            backgroundColor: ['#198754', '#dc3545'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }

            // Category chart
            const categoryCanvas = document.getElementById('categoryChart');
            if (categoryCanvas && categoryCanvas.dataset.categories) {
                const ctx = categoryCanvas.getContext('2d');
                const categories = JSON.parse(categoryCanvas.dataset.categories);

                if (window.categoryChart) {
                    window.categoryChart.destroy();
                }

                window.categoryChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: categories.map(c => c.category_name),
                        datasets: [{
                            data: categories.map(c => c.total),
                            backgroundColor: [
                                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                                '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225',
                                '#E83E8C', '#20C997', '#6F42C1', '#FD7E14'
                            ],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'right'
                            }
                        }
                    }
                });
            }

            // Yearly chart
            const yearlyCanvas = document.getElementById('yearlyChart');
            if (yearlyCanvas && yearlyCanvas.dataset.monthly) {
                const ctx = yearlyCanvas.getContext('2d');
                const monthly = JSON.parse(yearlyCanvas.dataset.monthly);

                if (window.yearlyChart) {
                    window.yearlyChart.destroy();
                }

                window.yearlyChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: monthly.map(m => `${m.month}月`),
                        datasets: [
                            {
                                label: '収入',
                                data: monthly.map(m => m.income),
                                backgroundColor: '#198754'
                            },
                            {
                                label: '支出',
                                data: monthly.map(m => m.expense),
                                backgroundColor: '#dc3545'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '¥' + value.toLocaleString();
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        }
                    }
                });
            }
        }
    };
}

// Global functions for HTMX/onclick handlers
function editTransaction(id) {
    fetch(`${API_BASE}/transactions/${id}`)
        .then(res => res.json())
        .then(data => {
            Alpine.store('app') || document.querySelector('[x-data]').__x.$data.showEditTransaction(data);
        })
        .catch(err => console.error(err));
}

function deleteTransaction(id) {
    const appData = document.querySelector('[x-data]').__x.$data;
    appData.showDeleteConfirm(id);
}

// Format currency
function formatCurrency(amount) {
    return '¥' + amount.toLocaleString();
}
