$path = "app/(dashboard)/ai-chat/page.tsx"
$content = Get-Content $path -Raw
# Replace "บันทึกสำเร็จ (SAVED)" with detailed button UI
$newContent = $content -replace "<span>บันทึกสำเร็จ \(SAVED\)</span>", '<span>บันทึกและอัปเดตยอดคงเหลือแล้ว</span></div><button onClick={() => window.location.href = ''/dashboard''} className="w-full py-3 rounded-[8px] bg-[#39FF14] text-[#1A1D21] font-bold text-[10px] tracking-[4px] uppercase shadow-[0_0_20px_#39FF1440] hover:shadow-[0_0_30px_#39FF1460] transition-all flex items-center justify-center gap-2"><Sparkles size={14} /> ดู DASHBOARD // VIEW DASHBOARD</button>'
$newContent | Set-Content $path
