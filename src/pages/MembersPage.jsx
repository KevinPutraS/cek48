// src/pages/MembersPage.jsx
import { useEffect, useState } from "react";
import MembersPageView from "../features/members/MembersPageView";
import useMembersDirectory from "../features/members/useMembersDirectory";

export default function MembersPage() {
  const directory = useMembersDirectory();
  
  // 1. Buat state untuk menampung data
  const [liveMembers, setLiveMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);
      try {
        // 2. Tarik data radar & member barengan
        await Promise.all([
          fetch("/api/jkt48-live")
            .then((res) => res.json())
            .then(setLiveMembers)
            .catch(() => []), // Kalau radar gagal/error, anggap kosong biar web tidak crash
          directory.loadMembers()
        ]);
      } catch (err) {
        console.error("Gagal load data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initPage();
  }, []);

  // 3. KIRIM KE VIEW (INI YANG PALING PENTING)
  return (
    <MembersPageView 
      directory={directory} 
      liveMembers={liveMembers} 
      isLoading={isLoading} 
    />
  );
}