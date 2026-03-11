const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Путі до JSON файлів
const usersFile = path.join(__dirname, 'data', 'users.json');
const operatorsFile = path.join(__dirname, 'data', 'operators.json');
const transactionsFile = path.join(__dirname, 'data', 'transactions.json');

// Створюємо папку data якщо не існує
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Початкові дані
const defaultUsers = [
    {
        id: 1,
        firstName: 'Адміністратор',
        lastName: 'Система',
        patronymic: '',
        team: '',
        username: 'admin',
        password: '123456',
        role: 'admin',
        name: 'Система Адміністратор',
        balance: 50,
        createdAt: new Date().toISOString(),
        achievements: [1]
    }
];

// Функції для роботи з файлами
function readUsers() {
    try {
        if (fs.existsSync(usersFile)) {
            return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading users:', err);
    }
    return defaultUsers;
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing users:', err);
        return false;
    }
}

function readOperators() {
    try {
        if (fs.existsSync(operatorsFile)) {
            return JSON.parse(fs.readFileSync(operatorsFile, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading operators:', err);
    }
    return [];
}

function writeOperators(operators) {
    try {
        fs.writeFileSync(operatorsFile, JSON.stringify(operators, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing operators:', err);
        return false;
    }
}

function readTransactions() {
    try {
        if (fs.existsSync(transactionsFile)) {
            return JSON.parse(fs.readFileSync(transactionsFile, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading transactions:', err);
    }
    return [];
}

function writeTransactions(transactions) {
    try {
        fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error writing transactions:', err);
        return false;
    }
}

// ============= AUTH =============
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Неправильний логін або пароль' });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            balance: user.balance,
            achievements: user.achievements
        }
    });
});

app.post('/api/signup', (req, res) => {
    const { name, username, password, passwordConfirm } = req.body;
    let users = readUsers();

    if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, message: 'Паролі не збігаються' });
    }

    if (users.some(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Цей логін уже використовується' });
    }

    const nameParts = name.split(' ');
    const newUser = {
        id: Date.now(),
        firstName: nameParts[0] || '',
        lastName: nameParts[1] || '',
        patronymic: nameParts[2] || '',
        team: '',
        username,
        password,
        role: 'user',
        name,
        balance: 50,
        createdAt: new Date().toISOString(),
        achievements: [1]
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ success: true, message: 'Користувач створений!' });
});

// ============= USERS =============
app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { firstName, lastName, patronymic, team, username, password, role } = req.body;
    let users = readUsers();

    if (users.some(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Цей логін уже використовується' });
    }

    const fullName = `${lastName} ${firstName} ${patronymic}`.trim();
    const newUser = {
        id: Date.now(),
        name: fullName,
        lastName,
        firstName,
        patronymic,
        team,
        username,
        password,
        role,
        balance: 50,
        createdAt: new Date().toISOString(),
        achievements: [1]
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ success: true, user: newUser });
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, patronymic, team, role } = req.body;
    let users = readUsers();

    const user = users.find(u => u.id === parseInt(id));
    if (!user) {
        return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.patronymic = patronymic;
    user.team = team;
    user.role = role;
    user.name = `${lastName} ${firstName} ${patronymic}`.trim();

    writeUsers(users);
    res.json({ success: true, user });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    let users = readUsers();

    users = users.filter(u => u.id !== parseInt(id));
    writeUsers(users);

    res.json({ success: true });
});

// ============= BALANCE =============
app.get('/api/users/:id/balance', (req, res) => {
    const { id } = req.params;
    const users = readUsers();
    const user = users.find(u => u.id === parseInt(id));

    if (!user) {
        return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    res.json({ balance: user.balance });
});

app.put('/api/users/:id/balance', (req, res) => {
    const { id } = req.params;
    const { balance } = req.body;
    let users = readUsers();

    const user = users.find(u => u.id === parseInt(id));
    if (!user) {
        return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    user.balance = balance;
    writeUsers(users);

    res.json({ success: true, balance: user.balance });
});

// ============= OPERATORS =============
app.get('/api/operators', (req, res) => {
    const operators = readOperators();
    res.json(operators);
});

app.post('/api/operators', (req, res) => {
    const operator = req.body;
    let operators = readOperators();

    operator.id = Date.now();
    operators.push(operator);
    writeOperators(operators);

    res.json({ success: true, operator });
});

app.put('/api/operators/:id', (req, res) => {
    const { id } = req.params;
    let operators = readOperators();

    const index = operators.findIndex(o => o.id === parseInt(id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Оператора не знайдено' });
    }

    operators[index] = { ...operators[index], ...req.body };
    writeOperators(operators);

    res.json({ success: true, operator: operators[index] });
});

// ============= TRANSACTIONS =============
app.get('/api/transactions', (req, res) => {
    const transactions = readTransactions();
    res.json(transactions);
});

app.post('/api/transactions', (req, res) => {
    const transaction = req.body;
    let transactions = readTransactions();

    transaction.id = Date.now();
    transaction.timestamp = new Date().toISOString();
    transactions.push(transaction);
    writeTransactions(transactions);

    res.json({ success: true, transaction });
});

// ============= ROULETTE =============
app.post('/api/roulette/spin', (req, res) => {
    const { userId, betAmount, betType, betNumber } = req.body;
    let users = readUsers();
    let transactions = readTransactions();

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'Користувача не знайдено' });
    }

    if (user.balance < betAmount) {
        return res.status(400).json({ success: false, message: 'Недостатньо коїнів' });
    }

    const winningNumber = Math.floor(Math.random() * 37);
    const isRed = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber);

    let won = false;
    let winnings = 0;

    if (betType === 'red' && isRed) {
        won = true;
        winnings = betAmount * 2;
    } else if (betType === 'black' && !isRed && winningNumber !== 0) {
        won = true;
        winnings = betAmount * 2;
    } else if (betType === 'number' && parseInt(betNumber) === winningNumber) {
        won = true;
        winnings = betAmount * 36;
    }

    if (won) {
        user.balance += winnings;
    } else {
        user.balance -= betAmount;
    }

    writeUsers(users);

    const transaction = {
        id: Date.now(),
        userId,
        type: 'roulette',
        betAmount,
        betType,
        betNumber: betNumber || null,
        winningNumber,
        won,
        winnings: won ? winnings : -betAmount,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    writeTransactions(transactions);

    res.json({
        success: true,
        won,
        winningNumber,
        winnings: won ? winnings : -betAmount,
        newBalance: user.balance
    });
});

// ============= SERVER =============
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FAVBOT Server запущен на порті ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});

module.exports = app;
