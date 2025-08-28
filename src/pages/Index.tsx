
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MusicGrid from "@/components/MusicGrid";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [openNotice, setOpenNotice] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("Aviso");
  const [closeLabel, setCloseLabel] = useState("Entendi");

  useEffect(() => {
    const fetchNotice = async () => {
      const { data, error } = await supabase
        .from('site_notices')
        .select('enabled, message, title, close_button_label')
        .maybeSingle();

      if (!error && data && data.enabled) {
        setNoticeMessage(data.message || "");
        setNoticeTitle(data.title || "Aviso");
        setCloseLabel(data.close_button_label || "Entendi");
        setOpenNotice(true);
      }
    };
    fetchNotice();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Mobile: FeaturedCarousel primeiro */}
        <div className="block md:hidden">
          <FeaturedCarousel />
          <MusicGrid />
        </div>
        
        {/* Desktop: MusicGrid primeiro, depois FeaturedCarousel */}
        <div className="hidden md:block">
          <MusicGrid />
          {/* FeaturedCarousel temporariamente removido da versão desktop a pedido do cliente */}
          {/* Para reativar, descomente a linha abaixo: */}
          {/* <FeaturedCarousel /> */}
        </div>
      </main>
      <Footer />

      {/* Popup de aviso */}
      <Dialog open={openNotice} onOpenChange={setOpenNotice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{noticeTitle}</DialogTitle>
            <DialogDescription>
              {noticeMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpenNotice(false)}>{closeLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
