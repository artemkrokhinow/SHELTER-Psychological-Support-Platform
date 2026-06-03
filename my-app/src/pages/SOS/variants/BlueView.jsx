import { ArrowRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../infrastructure/api/api";

const TASKS = [
	{
		text: "Знайдіть 5 предметів навколо",
		icon: "👁️",
		color: "from-blue-500/20 to-indigo-500/20",
		border: "border-blue-500/30",
	},
	{
		text: "Торкніться 4 різних текстур",
		icon: "🤲",
		color: "from-purple-500/20 to-pink-500/20",
		border: "border-purple-500/30",
	},
	{
		text: "Почуйте 3 різні звуки",
		icon: "👂",
		color: "from-emerald-500/20 to-teal-500/20",
		border: "border-emerald-500/30",
	},
	{
		text: "Відчуйте 2 різні запахи",
		icon: "🌿",
		color: "from-amber-500/20 to-orange-500/20",
		border: "border-amber-500/30",
	},
	{
		text: "Відчуйте 1 смак",
		icon: "✨",
		color: "from-rose-500/20 to-red-500/20",
		border: "border-rose-500/30",
	},
];

export default function BlueView({ answers }) {
	const [step, setStep] = useState(0);
	const navigate = useNavigate();

	const task = TASKS[step];
	const isLast = step === TASKS.length - 1;
	const progress = ((step + 1) / TASKS.length) * 100;

	const handleFinish = async () => {
		const userId = localStorage.getItem("userId");
		if (userId)
			await api.updateResilience(
				userId,
				"sos",
				{},
				"Стабілізація (Заземлення)",
			);
		navigate("/main");
	};

	return (
		<div className="fixed inset-0 bg-[#070a12] flex flex-col items-center justify-center overflow-hidden">
			{}
			<div
				className={`absolute inset-0 bg-gradient-to-br ${task.color} opacity-30 transition-all duration-1000`}
			/>

			{}
			<div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
				<button
					onClick={() => navigate("/main")}
					className="flex items-center gap-2 text-slate-600 hover:text-slate-300 font-bold uppercase text-xs tracking-widest transition-all"
				>
					<ChevronLeft size={18} /> Вийти
				</button>
				<button
					onClick={() => navigate("/sos")}
					className="text-slate-600 hover:text-slate-400 font-bold text-xs uppercase tracking-widest transition-all"
				>
					← До дихання
				</button>
			</div>

			{}
			<div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/50">
				<div
					className="h-full bg-emerald-500 transition-all duration-700 ease-out"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{}
			<div className="z-10 flex flex-col items-center gap-8 max-w-lg w-full px-8 animate-in fade-in duration-500">
				{}
				<div className="flex gap-2">
					{TASKS.map((_, i) => (
						<div
							key={i}
							className={`h-1.5 rounded-full transition-all duration-500 ${
								i <= step ? "bg-emerald-500 w-8" : "bg-slate-700 w-4"
							}`}
						/>
					))}
				</div>

				{}
				<div
					key={step}
					className={`w-full bg-slate-900/60 border ${task.border} rounded-[40px] p-12 backdrop-blur-xl text-center shadow-2xl animate-in zoom-in-95 duration-500`}
				>
					<div className="text-8xl mb-8 animate-in zoom-in duration-500">
						{task.icon}
					</div>
					<h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-4">
						{task.text}
					</h2>
					<p className="text-slate-500 text-sm">
						Крок {step + 1} з {TASKS.length} · Техніка заземлення 5-4-3-2-1
					</p>
				</div>

				{}
				{!isLast ? (
					<button
						onClick={() => setStep((s) => s + 1)}
						className="flex items-center gap-3 bg-white text-[#0b0f1a] px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 transition-all"
					>
						Виконано <ArrowRight size={20} />
					</button>
				) : (
					<button
						onClick={handleFinish}
						className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-[#0b0f1a] px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all"
					>
						Стан стабілізовано 🌱
					</button>
				)}
			</div>
		</div>
	);
}
