"use client";

import { useState, useEffect } from "react";

export default function HostDisplay() {
  const [host, setHost] = useState("—");
  useEffect(() => {
    setHost(window.location.host);
  }, []);
  return <code>{host}</code>;
}
