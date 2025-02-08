// db.js
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Configure the connection to the database
const pool = new Pool({
    user: 'postgres', // Replace with your PostgreSQL username
    host: 'agentt.c4nhdkfa7fvy.us-east-2.rds.amazonaws.com',      // Change if your database is on another host
    database: 'postgres', // Replace with the name of your database
    password: 'Xxzzzxx123_1', // Replace with your password
    port: 5432,             // The default port for PostgreSQL
});

// Function to initialize the database and create the table if it doesn't exist
const initializeDatabase = async () => {
    const createTokensTableQuery = `
        CREATE TABLE IF NOT EXISTS tokens (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            symbol VARCHAR(50) NOT NULL,
            description TEXT,
            agent_explanation TEXT,
            tweet_related_link VARCHAR(255),
            contract_address VARCHAR(255)
        );`;

    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );`;

    const createWalletsTableQuery = `
        CREATE TABLE IF NOT EXISTS wallets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            private_key VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(255) NOT NULL
        );`;

    try {
        await pool.query(createTokensTableQuery);
        await pool.query(createUsersTableQuery);
        await pool.query(createWalletsTableQuery);
        console.log("Table 'tokens' is ready.");
    } catch (error) {
        console.error("Error creating table:", error);
    }
};

// Function to create a new token in the 'tokens' table
export const createToken = async (name, symbol, description, agent_explanation, tweet_related_link, contract_address) => {
    const query = `
        INSERT INTO tokens (name, symbol, description, agent_explanation, tweet_related_link, contract_address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;`;

    const values = [name, symbol, description, agent_explanation, tweet_related_link, contract_address];

    try {
        const res = await pool.query(query, values);
        return res.rows[0]; // Return the newly created token
    } catch (error) {
        console.error("Error creating token:", error);
        throw error; // Throw the error to be handled by the caller
    }
};

// Function to register a new user
export const registerUser = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id';

    try {
        const result = await pool.query(query, [username, hashedPassword]);
        return result.rows[0].id; // Return the new user's ID
    } catch (error) {
        console.error("Error registering user:", error);
        throw error; // Throw the error to be handled by the caller
    }
};

// Function to login a user
export const loginUser = async (username, password) => {
    const query = 'SELECT * FROM users WHERE username = $1';

    try {
        const result = await pool.query(query, [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET, {expiresIn: '1h'})
            return token; // Return the user object if login is successful
        } else {
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        console.error("Error logging in:", error);
        throw error; // Throw the error to be handled by the caller
    }
};

// Function to insert a new wallet
export const createWallet = async (userId, privateKey, walletAddress) => {
    const query = 'INSERT INTO wallets (user_id, private_key, wallet_address) VALUES ($1, $2, $3) RETURNING id';

    try {
        const result = await pool.query(query, [userId, privateKey, walletAddress]);
        return result.rows[0].id; // Return the new wallet's ID
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error; // Throw the error to be handled by the caller
    }
};

// Function to get a wallet by user_id
export const getWalletByUserId = async (userId) => {
    const query = 'SELECT * FROM wallets WHERE user_id = $1';

    try {
        const result = await pool.query(query, [userId]);
        return result.rows; // Return the wallets associated with the user
    } catch (error) {
        console.error("Error retrieving wallet:", error);
        throw error; // Throw the error to be handled by the caller
    }
};

// Function to find a token by parameter
export const findTokenByParameter = async (searchTerm: string) => {
    const query = `
        SELECT * FROM tokens 
        WHERE name = $1 OR symbol = $1 OR contract_address = $1
        LIMIT 1;
    `;

    try {
        const res = await pool.query(query, [searchTerm]);
        return res.rows.length > 0 ? res.rows[0] : null; // Retorna el primer registro encontrado o null
    } catch (error) {
        console.error("Error buscando token:", error);
        throw error; // Lanza el error para que sea manejado por el llamador
    }
};

// Function to find a token by id
export const getTokenById = async (id: number) => {
    const query = `
        SELECT * FROM tokens 
        WHERE id = $1;
    `;

    try {
        const res = await pool.query(query, [id]);
        return res.rows.length > 0 ? res.rows[0] : null; // Retorna el token encontrado o null
    } catch (error) {
        console.error("Error buscando token por ID:", error);
        throw error; // Lanza el error para que sea manejado por el llamador
    }
};

// Function to obtain all tokens
export const getAllTokens = async () => {
    const query = `
        SELECT * FROM tokens;
    `;

    try {
        const res = await pool.query(query);
        return res.rows; // Retorna todos los tokens
    } catch (error) {
        console.error("Error obteniendo todos los tokens:", error);
        throw error; // Lanza el error para que sea manejado por el llamador
    }
};

// Initialize the database when the module is loaded
initializeDatabase();

export default pool; // Export the pool for use in other parts of the application