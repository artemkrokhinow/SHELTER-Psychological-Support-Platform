import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

dotenv.config();

import materialRoutes from './routes/materials.js';
import scenarioRoutes from './routes/scenarios.js';
import statsRouter from './routes/stats.js';
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import diagnosticRoutes from "./routes/diagnostic.js";
import adviceRoutes from "./routes/advice.js";
import { ensureSortingScenarios } from "./utils/ensureSortingScenarios.js";
import { ensureAdvices } from "./utils/ensureAdvices.js";

const app = express();

const allowedOrigins = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
	"https://shelter-1-rhi3.onrender.com"
];

app.use(
	cors({
		origin: (origin, callback) => {
			if (
				!origin || 
				allowedOrigins.includes(origin) || 
				/^http:\/\/localhost:\d+$/.test(origin) || 
				/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
			) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
	})
);

app.use(express.json());
app.use(cookieParser());


app.use((req, res, next) => {
	const start = Date.now();
	res.on('finish', () => {
		const duration = Date.now() - start;
	});
	next();
});

const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shelter_db";


mongoose
	.connect(dbURI, {
		serverSelectionTimeoutMS: 30000,
		socketTimeoutMS: 45000,
		connectTimeoutMS: 30000,
		maxPoolSize: 10,
		minPoolSize: 2,
	})
	.then(async () => {
		try {
			await ensureSortingScenarios();
			await ensureAdvices();
		} catch (err) {
			console.error(`[${new Date().toISOString()}] ❌ Seed error:`, err.message);
		}
	})
	.catch((err) => {
		console.error(`[${new Date().toISOString()}] ❌ MongoDB Connection Error:`, err.message);
		console.error(`[${new Date().toISOString()}] ❌ Full error:`, err);
		console.error(`[${new Date().toISOString()}] ❌ MongoDB URI used:`, dbURI.replace(/:[^:]+@/, ":****@"));
		console.error(`[${new Date().toISOString()}] ❌ Process will exit now...`);
		process.exit(1);
	});

app.use("/api/auth", authRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/stats", statsRouter);
app.use("/api/users", userRoutes);
app.use("/api/diagnostic", diagnosticRoutes);
app.use("/api/advice", adviceRoutes);


app.get("/api/health", async (req, res) => {
	try {
		const mongoStatus = mongoose.connection.readyState;
		const mongoStatusText = mongoStatus === 1 ? "connected" : mongoStatus === 2 ? "connecting" : "disconnected";
		
		res.status(200).json({ 
			status: "OK", 
			message: "Server is running",
			mongodb: {
				status: mongoStatusText,
				readyState: mongoStatus,
				dbName: mongoose.connection.name || "not connected"
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		res.status(500).json({ 
			status: "ERROR", 
			message: "Server error",
			error: error.message 
		});
	}
});


app.get("/api/db-dump", async (req, res) => {
	try {
		
		const db = mongoose.connection.db;
		const collections = await db.listCollections().toArray();
		
		
		const fullDump = {
			database: db.databaseName,
			collections: [],
			totalDocuments: 0
		};
		
		for (const collection of collections) {
			const collData = {
				name: collection.name,
				count: 0,
				documents: []
			};
			
			try {
				const docs = await db.collection(collection.name).find({}).toArray();
				collData.count = docs.length;
				collData.documents = docs;
				fullDump.totalDocuments += docs.length;
				
			} catch (err) {
				console.error(`[${new Date().toISOString()}] ❌ Error reading collection ${collection.name}:`, err.message);
				collData.error = err.message;
			}
			
			fullDump.collections.push(collData);
		}
		
		
		res.status(200).json(fullDump);
	} catch (err) {
		console.error(`[${new Date().toISOString()}] ❌ Database dump error:`, err.message);
		res.status(500).json({ error: err.message });
	}
});


app.get("/api/mongodb-test", async (req, res) => {
	try {

		
		const startTime = Date.now();
		const collections = await mongoose.connection.db.listCollections().toArray();
		const duration = Date.now() - startTime;


		
		const collectionDetails = {};
		for (const collection of collections) {
			const collStartTime = Date.now();
			const count = await mongoose.connection.db.collection(collection.name).countDocuments();
			const collDuration = Date.now() - collStartTime;
			
			collectionDetails[collection.name] = {
				count: count,
				duration: `${collDuration}ms`
			};
			
			
			if (count > 0) {
				const firstDoc = await mongoose.connection.db.collection(collection.name).findOne();
				collectionDetails[collection.name].firstDocument = {
					_id: firstDoc._id,
					title: firstDoc.title || firstDoc.name || 'N/A',
					keys: Object.keys(firstDoc).slice(0, 5)
				};
			}
		}


		res.status(200).json({
			status: "OK",
			connected: mongoose.connection.readyState === 1,
			database: mongoose.connection.name,
			collections: collections.length,
			collectionNames: collections.map(c => c.name),
			details: collectionDetails,
			duration: `${duration}ms`
		});
	} catch (err) {
		console.error(`[${new Date().toISOString()}] ❌ MongoDB test error:`, err.message);
		console.error(`[${new Date().toISOString()}] Full error:`, err);
		res.status(500).json({
			error: err.message,
			connected: mongoose.connection.readyState === 1,
			state: mongoose.connection.readyState,
			database: mongoose.connection.name
		});
	}
});

import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		credentials: true
	}
});

app.set('io', io);

io.on("connection", (socket) => {
	
	socket.on("join", (userId) => {
		socket.join(userId);
	});

	socket.on("disconnect", () => {
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});
