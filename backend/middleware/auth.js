import jwt from "jsonwebtoken";

export default function (req, res, next) {
	const token = req.header("x-auth-token");
	if (!token) return res.status(401).json({ message: "Авторизація відхилена" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
		req.user = decoded;
		next();
	} catch (e) {
		res.status(400).json({ message: "Токен недійсний" });
	}
}
