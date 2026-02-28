import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"

const HIGHLIGHT_COLORS = [
	{ name: "Red", value: "#ef4444" },
	{ name: "Orange", value: "#f97316" },
	{ name: "Yellow", value: "#eab308" },
	{ name: "Green", value: "#22c55e" },
	{ name: "Blue", value: "#3b82f6" },
	{ name: "Purple", value: "#a855f7" },
	{ name: "Pink", value: "#ec4899" },
]

interface ColorPickerProps {
	value?: string
	onChange: (color: string | undefined) => void
	className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	return (
		<div className={cn("flex items-center gap-1.5", className)}>
			{/* Clear color button */}
			<button
				type="button"
				onClick={() => onChange(undefined)}
				className={cn(
					"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
					!value
						? "border-[#666] bg-[#333]"
						: "border-[#444] bg-[#252525] hover:border-[#555]"
				)}
				title="No color"
			>
				{!value && <X className="w-3 h-3 text-[#888]" />}
			</button>
			{HIGHLIGHT_COLORS.map((color) => (
				<button
					key={color.value}
					type="button"
					onClick={() => onChange(color.value)}
					className={cn(
						"w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
						value === color.value
							? "border-white scale-110"
							: "border-transparent hover:scale-110"
					)}
					style={{ backgroundColor: color.value }}
					title={color.name}
				>
					{value === color.value && (
						<Check className="w-3 h-3 text-white drop-shadow-md" />
					)}
				</button>
			))}
		</div>
	)
}
