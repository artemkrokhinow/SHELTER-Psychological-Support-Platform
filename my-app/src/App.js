import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "./infrastructure/api/api";
import AdminPage from "./pages/Admin/AdminPage";
import AuthPage from "./pages/Auth/AuthPage";
import SosPage from "./pages/SOS/sosPage";
import ShelterAppComplete from "./main/ShelterAppComplete";
import SimulatorPage from "./pages/Simulator/SimulatorPage";
import MaterialPage from "./pages/Material/MaterialPage";
import UpdatedSortingPage from "./pages/Simulator/UpdatedSortingPage";
import UpdatedFindDifferencesPage from "./pages/Simulator/UpdatedFindDifferencesPage";
import UpdatedVideoScenarioPage from "./pages/Simulator/UpdatedVideoScenarioPage";

function App() {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const savedTheme = localStorage.getItem("dr_theme");
		if (savedTheme === "light") {
			document.documentElement.classList.add("light-theme");
		} else {
			document.documentElement.classList.remove("light-theme");
		}
	}, []);

	useEffect(() => {
		const initSession = async () => {

			const token = localStorage.getItem("dr_token");
			const userId = localStorage.getItem("userId");

			
			const hasValidSession =
				token &&
				token !== "guest_mode" &&
				userId &&
				userId !== "null" &&
				userId !== "undefined";

			const isGuestMode = token === "guest_mode";
			const isMissingId = !userId || userId === "null" || userId === "undefined";

			if (isGuestMode && isMissingId) {
				try {
					const data = await api.getProfile();
					if (data && data.id) {
						localStorage.setItem("userId", data.id);
						localStorage.setItem("username", data.username || "Гість");
					}
				} catch (e) {
					console.error("❌ [DEBUG] Failed to restore guest session:", e);
					localStorage.removeItem("dr_token"); 
				}
			} else if (!hasValidSession && !isGuestMode) {
				
				localStorage.removeItem("dr_token");
				localStorage.removeItem("userId");
				try {
					const data = await api.loginAsGuest();
					
					const guestUser = data.user || data;
					if (guestUser.id) {
						localStorage.setItem("dr_token", "guest_mode");
						localStorage.setItem("userId", guestUser.id);
						localStorage.setItem("username", guestUser.username || "Гість");
					}
				} catch (e) {
					console.error(e);
				}
			}
			setIsReady(true);
		};
		initSession();
	}, []);

	if (!isReady) return null;

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to="/main" replace />} />
				<Route path="/main" element={<ShelterAppComplete />} />
				<Route path="/auth" element={<AuthPage />} />
				<Route path="/sos/:answers?" element={<SosPage />} />
				<Route path="/admin" element={<AdminPage />} />
				<Route path="/exercises/:id" element={<SimulatorPage />} />
				<Route path="/material/:id" element={<MaterialPage />} />
				<Route path="/sorting/:id" element={<UpdatedSortingPage />} />
				<Route path="/find-differences/:id" element={<UpdatedFindDifferencesPage />} />
				<Route path="/video-scenario/:id" element={<UpdatedVideoScenarioPage />} />
				<Route path="*" element={<Navigate to="/main" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
