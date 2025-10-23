import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FinancialCharts from './FinancialCharts';

const categories = {
    income: [
        { name: 'Salary', icon: '💼', color: '#10b981' },
        { name: 'Freelance', icon: '💻', color: '#3b82f6' },
        { name: 'Investment', icon: '📈', color: '#8b5cf6' },
        { name: 'Gift', icon: '🎁', color: '#ec4899' },
        { name: 'Other Income', icon: '💰', color: '#06b6d4' }
    ],
    expense: [
        { name: 'Food', icon: '🍽️', color: '#f97316' },
        { name: 'Transportation', icon: '🚗', color: '#7c3aed' },
        { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
        { name: 'Bills', icon: '📄', color: '#dc2626' },
        { name: 'Entertainment', icon: '🎬', color: '#06b6d4' },
        { name: 'Healthcare', icon: '🏥', color: '#3b82f6' },
        { name: 'Other Expense', icon: '💸', color: '#6b7280' }
    ]
};

function TransactionModal({ isOpen, onClose, onSave, type }) {
    const [formData, setFormData] = useState({
        type: type || 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash'
    });

    useEffect(() => {
        if (type) {
            setFormData(prev => ({ ...prev, type, category: '' }));
        }
    }, [type]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.amount && formData.description && formData.category) {
            onSave({
                ...formData,
                amount: parseFloat(formData.amount),
                id: Date.now()
            });
            setFormData({
                type: 'expense',
                amount: '',
                description: '',
                category: '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash'
            });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add {formData.type === 'income' ? 'Income' : 'Expense'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Type</label>
                        <select 
                            className="form-select"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value, category: ''})}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Amount (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: e.target.value})}
                            placeholder="Enter amount"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="What's this for?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select 
                            className="form-select"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            required
                        >
                            <option value="">Select category</option>
                            {categories[formData.type].map(cat => (
                                <option key={cat.name} value={cat.name}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.date}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Payment Method</label>
                        <select 
                            className="form-select"
                            value={formData.paymentMethod}
                            onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>

                    <div className="form-buttons">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save">
                            Save Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function FinancialTracker() {
    const [transactions, setTransactions] = useState([
        { id: 1, type: 'income', amount: 50000, description: 'Salary', category: 'Salary', date: '2024-08-20', paymentMethod: 'Bank Transfer' },
        { id: 2, type: 'expense', amount: 5000, description: 'Groceries', category: 'Food', date: '2024-08-21', paymentMethod: 'UPI' },
        { id: 3, type: 'expense', amount: 2000, description: 'Movie tickets', category: 'Entertainment', date: '2024-08-22', paymentMethod: 'Credit Card' },
        { id: 4, type: 'income', amount: 15000, description: 'Freelance project', category: 'Freelance', date: '2024-08-23', paymentMethod: 'UPI' },
        { id: 5, type: 'expense', amount: 3000, description: 'Uber rides', category: 'Transportation', date: '2024-08-24', paymentMethod: 'Credit Card' },
        { id: 6, type: 'expense', amount: 8000, description: 'Electricity bill', category: 'Bills', date: '2024-08-19', paymentMethod: 'UPI' }
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('expense');
    const [activeTab, setActiveTab] = useState('all');
    const [activeNav, setActiveNav] = useState('dashboard');
    const navigate = useNavigate();

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    const handleAddTransaction = (transaction) => {
        setTransactions(prev => [transaction, ...prev]);
    };

    const openModal = (type = 'expense') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const getCategoryInfo = (categoryName, type) => {
        return categories[type].find(cat => cat.name === categoryName) || 
               { icon: '💰', color: '#6b7280' };
    };

    const filteredTransactions = transactions.filter(t => {
        if (activeTab === 'all') return true;
        return t.type === activeTab;
    });

    return (
        <div className="financial-tracker-container app-container">
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        💰 Financial Tracker
                    </div>
                </div>
                
                <div className="nav-menu">
                    <div 
                        className={`nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveNav('dashboard')}
                    >
                        <span className="icon">📊</span>
                        Dashboard
                    </div>
                    <div 
                        className={`nav-item ${activeNav === 'transactions' ? 'active' : ''}`}
                        onClick={() => setActiveNav('transactions')}
                    >
                        <span className="icon">💳</span>
                        Transactions
                    </div>
                    <div 
                        className={`nav-item ${activeNav === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveNav('categories')}
                    >
                        <span className="icon">📂</span>
                        Categories
                    </div>
                    <div 
                        className={`nav-item ${activeNav === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveNav('reports')}
                    >
                        <span className="icon">📈</span>
                        Reports
                    </div>
                    <div 
                        className="nav-item"
                        onClick={() => navigate('/')}
                        style={{ marginTop: 'auto', borderTop: '1px solid #e9ecef' }}
                    >
                        <span className="icon">🏠</span>
                        Back to Dashboard
                    </div>
                </div>
            </div>

            <div className="main-content">
                <div className="header">
                    <h1>Financial Dashboard</h1>
                    <button className="add-btn" onClick={() => openModal()}>
                        <span>+</span>
                        Add Transaction
                    </button>
                </div>

                <div className="content-area">
                    <FinancialCharts answers={{
                        monthlyIncome: 65000,
                        monthlyExpense: 18000,
                        monthlyEMI: 8000,
                        monthlySavings: 15000
                    }} />

                    <div className="stats-grid">
                        <div className="stat-card income-stat">
                            <h3>₹{totalIncome.toLocaleString()}</h3>
                            <p>Total Income</p>
                        </div>
                        <div className="stat-card expense-stat">
                            <h3>₹{totalExpenses.toLocaleString()}</h3>
                            <p>Total Expenses</p>
                        </div>
                        <div className="stat-card balance-stat">
                            <h3>₹{netBalance.toLocaleString()}</h3>
                            <p>Net Balance</p>
                        </div>
                        <div className="stat-card">
                            <h3>{transactions.length}</h3>
                            <p>Total Transactions</p>
                        </div>
                    </div>

                    <div className="transactions-section">
                        <div className="section-header">
                            <h2>Recent Transactions</h2>
                            <div className="filter-tabs">
                                <button 
                                    className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('all')}
                                >
                                    All
                                </button>
                                <button 
                                    className={`filter-tab ${activeTab === 'income' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('income')}
                                >
                                    Income
                                </button>
                                <button 
                                    className={`filter-tab ${activeTab === 'expense' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('expense')}
                                >
                                    Expenses
                                </button>
                            </div>
                        </div>

                        <div className="transactions-list">
                            {filteredTransactions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="icon">📝</div>
                                    <h3>No transactions yet</h3>
                                    <p>Click the + button to add your first transaction</p>
                                </div>
                            ) : (
                                filteredTransactions.map(transaction => {
                                    const categoryInfo = getCategoryInfo(transaction.category, transaction.type);
                                    return (
                                        <div key={transaction.id} className="transaction-item">
                                            <div className="transaction-info">
                                                <div 
                                                    className="transaction-icon"
                                                    style={{ backgroundColor: categoryInfo.color + '20', color: categoryInfo.color }}
                                                >
                                                    {categoryInfo.icon}
                                                </div>
                                                <div className="transaction-details">
                                                    <h4>{transaction.description}</h4>
                                                    <p>{transaction.category} • {transaction.date} • {transaction.paymentMethod}</p>
                                                </div>
                                            </div>
                                            <div className={`transaction-amount ${transaction.type}`}>
                                                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddTransaction}
                type={modalType}
            />
        </div>
    );
}
