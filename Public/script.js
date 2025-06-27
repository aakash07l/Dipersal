// public/script.js
document.addEventListener('DOMContentLoaded', () => {
    const dispersalForm = document.getElementById('dispersalForm');
    const messageDiv = document.getElementById('message');
    const transactionsDiv = document.getElementById('transactions');

    dispersalForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        messageDiv.textContent = '';
        transactionsDiv.innerHTML = '';
        messageDiv.className = 'message';

        const network = document.getElementById('network').value;
        const tokenAddress = document.getElementById('tokenAddress').value.trim();
        const recipientAddresses = document.getElementById('recipientAddresses').value.split(',').map(addr => addr.trim()).filter(addr => addr);
        const amounts = document.getElementById('amounts').value.split(',').map(amount => parseFloat(amount.trim())).filter(amount => !isNaN(amount));

        if (!network || !tokenAddress || recipientAddresses.length === 0 || amounts.length === 0) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        if (recipientAddresses.length !== amounts.length) {
            showMessage('Number of recipient addresses must match the number of amounts.', 'error');
            return;
        }

        showMessage('Dispersing tokens... Please wait.', 'info'); // Add an info class to style this

        try {
            const response = await fetch('/api/disperse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ network, tokenAddress, recipientAddresses, amounts }),
            });

            const data = await response.json();

            if (data.success) {
                showMessage(data.message, 'success');
                if (data.transactions && data.transactions.length > 0) {
                    const ul = document.createElement('ul');
                    data.transactions.forEach(txHash => {
                        const li = document.createElement('li');
                        li.textContent = `Transaction Hash: ${txHash}`;
                        ul.appendChild(li);
                    });
                    transactionsDiv.innerHTML = '<h3>Transaction Hashes:</h3>';
                    transactionsDiv.appendChild(ul);
                }
            } else {
                showMessage(data.message || 'An unknown error occurred.', 'error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showMessage('Failed to connect to the server or an unexpected error occurred.', 'error');
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`; // e.g., 'message success' or 'message error'
    }
});
