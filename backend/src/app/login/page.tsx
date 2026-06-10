"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

/**
 * 二维码登录状态枚举
 */
type QrStatus = "loading" | "pending" | "scanned" | "confirmed" | "expired" | "error";

/**
 * 登录页面
 * 展示二维码，支持扫码登录管理后台
 */
export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<QrStatus>("loading");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // 创建会话
  const createSession = api.qrLogin.createSession.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      setStatus("pending");
      generateQrCode(data.token);
      setCountdown(300);
    },
    onError: () => {
      setStatus("error");
    },
  });

  // 检查状态
  const checkStatus = api.qrLogin.checkStatus.useQuery(
    { token },
    {
      enabled: !!token && status === "pending" || status === "scanned",
      refetchInterval: 2000,
      retry: false,
    }
  );

  /**
   * 生成二维码图片
   * @param text - 要编码的token文本
   */
  const generateQrCode = useCallback(async (text: string) => {
    try {
      const QRCode = await import("qrcode");
      // 生成小程序扫码识别的链接格式
      const qrContent = `qm://login?token=${text}`;
      const dataUrl = await QRCode.toDataURL(qrContent, {
        width: 240,
        margin: 2,
        color: {
          dark: "#1c1917",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    } catch {
      setStatus("error");
    }
  }, []);

  /**
   * 初始化会话
   */
  const initSession = useCallback(() => {
    setStatus("loading");
    setQrDataUrl("");
    setToken("");
    createSession.mutate();
  }, [createSession]);

  // 页面加载时初始化
  useEffect(() => {
    initSession();
  }, [initSession]);

  // 监听状态查询结果
  useEffect(() => {
    if (!checkStatus.data) return;

    const data = checkStatus.data;

    if (data.status === "scanned") {
      setStatus("scanned");
    } else if (data.status === "confirmed" && data.user) {
      setStatus("confirmed");
      // 存储用户信息到 localStorage
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      // 延迟跳转，让用户看到成功状态
      setTimeout(() => {
        router.push("/");
      }, 800);
    }
  }, [checkStatus.data, router]);

  // 监听查询错误（过期等）
  useEffect(() => {
    if (checkStatus.error) {
      const errorMessage = checkStatus.error.message;
      if (errorMessage.includes("过期")) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
    }
  }, [checkStatus.error]);

  // 倒计时
  useEffect(() => {
    if (status !== "pending" && status !== "scanned") {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [status]);

  // 格式化倒计时
  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 状态提示文本
  const getStatusText = () => {
    switch (status) {
      case "loading":
        return "正在生成二维码...";
      case "pending":
        return `请使用快灵感小程序扫码登录 (${formatCountdown()})`;
      case "scanned":
        return "扫描成功，请在小程序中确认登录";
      case "confirmed":
        return "登录成功，正在跳转...";
      case "expired":
        return "二维码已过期，请点击刷新";
      case "error":
        return "生成失败，请点击重试";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <h1 className="font-display text-[28px] font-semibold text-[#1c1917] tracking-tight">
            快灵感管理后台
          </h1>
          <p className="text-[13px] text-[#78716c] mt-2">
            微信扫码，安全登录
          </p>
        </div>

        {/* QR Code Card */}
        <div className="bg-white border border-[#e7e5e0] p-8">
          {/* QR Code Area */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              {qrDataUrl ? (
                <div className="relative">
                  <img
                    src={qrDataUrl}
                    alt="登录二维码"
                    className="w-[240px] h-[240px]"
                  />
                  {/* 扫描成功遮罩 */}
                  {status === "scanned" && (
                    <div className="absolute inset-0 bg-[#1c1917]/80 flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-[#5c7a5c] mb-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="text-white text-[13px] font-medium">
                        扫描成功
                      </span>
                    </div>
                  )}
                  {/* 过期遮罩 */}
                  {status === "expired" && (
                    <div className="absolute inset-0 bg-[#1c1917]/80 flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-[#a8a29e] mb-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-white text-[13px] font-medium mb-3">
                        二维码已过期
                      </span>
                      <button
                        onClick={initSession}
                        className="px-4 py-2 bg-white text-[#1c1917] text-[12px] font-medium hover:bg-[#f5f3ef] transition-colors"
                      >
                        点击刷新
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-[240px] h-[240px] bg-[#f5f3ef] flex items-center justify-center">
                  {status === "loading" ? (
                    <div className="w-8 h-8 border-2 border-[#e7e5e0] border-t-[#c9772b] rounded-full animate-spin" />
                  ) : (
                    <span className="text-[#a8a29e] text-[13px]">加载失败</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center">
            <p
              className={`text-[13px] ${
                status === "confirmed"
                  ? "text-[#5c7a5c] font-medium"
                  : status === "error" || status === "expired"
                  ? "text-[#b4534e]"
                  : "text-[#78716c]"
              }`}
            >
              {getStatusText()}
            </p>
          </div>

          {/* Progress bar for countdown */}
          {(status === "pending" || status === "scanned") && (
            <div className="mt-4">
              <div className="h-[2px] bg-[#f5f3ef] overflow-hidden">
                <div
                  className="h-full bg-[#c9772b] transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 300) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-[#a8a29e]">
            请使用快灵感小程序扫描二维码登录
          </p>
        </div>
      </div>
    </div>
  );
}
