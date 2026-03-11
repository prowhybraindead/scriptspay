import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, Code2, CreditCard, ShieldCheck, Webhook, Copy, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";

export const metadata = {
  title: "Scripts_ | Hướng dẫn tích hợp - Hộp cát (Sandbox)",
  description: "Cổng thanh toán thế hệ mới cho thị trường Việt Nam. VietQR, ví điện tử, trải nghiệm như Stripe.",
};

export default function ViDocsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
      <section className="surface-panel overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow-label">Tài liệu phát triển</span>
            <h1 className="text-4xl font-bold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Hướng dẫn tích hợp Scripts<span className="text-primary">_</span> cho các đội phát triển
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              URL cơ sở, quy tắc xác thực, các số tiền thần kỳ để test, và xác thực webhook - tất cả ở một nơi giúp bạn phát triển nhanh hơn.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">REST API</Badge>
              <Badge variant="secondary">Webhooks</Badge>
              <Badge variant="secondary">VietQR</Badge>
              <Badge variant="secondary">AI Debugger</Badge>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/developers"
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Mở bảng điều khiển nhà phát triển
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <a
                href="#quickstart"
                className="inline-flex items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              >
                Đến phần hướng dẫn nhanh
              </a>
            </div>
          </div>

          <div className="surface-dark p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <CreditCard className="h-5 w-5 text-cyan-200" />
                <p className="mt-4 text-lg font-semibold">Một luồng thanh toán, nhiều kết quả</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sử dụng các số tiền sandbox xác định để test thành công, không đủ tiền, và phục hồi timeout.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <Webhook className="h-5 w-5 text-cyan-200" />
                <p className="mt-4 text-lg font-semibold">Webhook retry đã được mô hình hóa</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Chữ ký HMAC và thời gian retry theo cấp số nhân được tích hợp sẵn trong sandbox.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Bề mặt xác thực",
            description: "Sử dụng Supabase JWTs với mỗi yêu cầu được bảo vệ.",
            icon: ShieldCheck,
          },
          {
            title: "Đường ray thanh toán",
            description: "Sandbox VietQR với các số tiền test thần kỳ và checkout được host.",
            icon: CreditCard,
          },
          {
            title: "Công cụ hỗ trợ",
            description: "AI debugger có thể giải thích các log gần đây của merchant trực tiếp từ bảng điều khiển.",
            icon: Bot,
          },
        ].map(({ title, description, icon: Icon }) => (
          <div key={title} className="surface-panel p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>

      <section id="quickstart" className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-panel p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            Các bước hướng dẫn nhanh
          </div>
          <ol className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">1. Trỏ client đến URL cơ sở API</p>
              <p className="mt-1 leading-6">Sử dụng URL cục bộ của bạn trong phát triển hoặc miền Railway được host trong các môi trường chia sẻ.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">2. Lấy JWT từ login Supabase</p>
              <p className="mt-1 leading-6">Token được trả về sau khi người dùng đăng nhập hợp lệ. Lưu trữ nó trong session/localStorage.</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">3. Gửi JWT trong header Authorization</p>
              <p className="mt-1 leading-6">Đính kèm token vào mỗi yêu cầu API có bảo vệ: <code className="text-xs font-mono">Authorization: Bearer &lt;JWT&gt;</code></p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">4. Test dòng thanh toán đầy đủ</p>
              <p className="mt-1 leading-6">Sử dụng các số tiền sandbox để trigger các kết quả khác nhau (xem bảng dưới).</p>
            </li>
            <li className="rounded-2xl bg-slate-100/80 p-4">
              <p className="font-semibold text-slate-950">5. Xử lý webhook trong ứng dụng</p>
              <p className="mt-1 leading-6">Webhook sẽ gửi sự kiện update. Xác thực chữ ký HMAC và xử lý idempotently.</p>
            </li>
          </ol>
        </div>

        <div className="surface-panel space-y-6 p-6">
          <div>
            <h3 className="font-semibold text-slate-950">API Base URL (Sandbox)</h3>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-slate-100 px-3 py-2 text-sm font-mono text-slate-700">
                https://scripts-api.selfservice.io.vn
              </code>
              <CopyButton text="https://scripts-api.selfservice.io.vn" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Số tiền Test (Magic Amounts)</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded bg-green-50 p-3 border border-green-200">
                <p className="font-mono font-semibold text-green-900">10000 VND</p>
                <p className="text-green-700">✓ Thanh toán thành công</p>
              </div>
              <div className="rounded bg-yellow-50 p-3 border border-yellow-200">
                <p className="font-mono font-semibold text-yellow-900">20000 VND</p>
                <p className="text-yellow-700">⚠ Không đủ tiền</p>
              </div>
              <div className="rounded bg-red-50 p-3 border border-red-200">
                <p className="font-mono font-semibold text-red-900">30000 VND</p>
                <p className="text-red-700">✗ Timeout/Lỗi mạng</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-950">Xác thực Webhook</h3>
            <div className="mt-3 rounded bg-slate-100 p-3">
              <p className="text-xs text-slate-600">Header: <code className="font-mono font-semibold">X-Webhook-Signature</code></p>
              <p className="mt-2 text-xs text-slate-600">Tính toán HMAC-SHA256 của body với secret key</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Các Endpoint API Chính</h2>
        <div className="mt-6 space-y-4">
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/profile"
            title="Lấy Hồ sơ Merchant"
            description="Lấy thông tin hồ sơ merchant hiện tại của bạn"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/balance"
            title="Số Dư Tài Khoản"
            description="Kiểm tra số dư khả dụng hiện tại và số tiền cần thanh toán"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/transactions"
            title="Lịch Sử Giao Dịch"
            description="Lấy danh sách các giao dịch đã xử lý với bộ lọc và phân trang"
          />
          <EndpointCard
            method="GET"
            path="/api/v1/merchants/keys"
            title="API Keys"
            description="Quản lý các khóa API của bạn để tích hợp bên ngoài"
          />
          <EndpointCard
            method="POST"
            path="/api/v1/checkout/create"
            title="Tạo Phiên Thanh Toán"
            description="Tạo một phiên checkout mới cho khách hàng của bạn"
          />
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8">
        <h2 className="text-2xl font-bold text-slate-950">Hỗ Trợ & Hỗ Trợ Khắc Phục Sự Cố</h2>
        <p className="mt-3 text-slate-600">
          Gặp vấn đề? Công cụ AI Debugger của chúng tôi có thể giáo dục bạn về các log gần đây của merchant. Truy cập bảng điều khiển nhà phát triển để kiểm tra.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">Lỗi 401 Unauthorized</p>
            <p className="mt-2 text-sm text-slate-600">Token JWT đã hết hạn hoặc không hợp lệ. Làm mới JWT từ phiên đăng nhập.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">Lỗi 403 Forbidden</p>
            <p className="mt-2 text-sm text-slate-600">Merchant không có quyền truy cập tài nguyên này. Kiểm tra quyền merchant.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">Lỗi 422 Validation</p>
            <p className="mt-2 text-sm text-slate-600">Dữ liệu yêu cầu không hợp lệ. Kiểm tra giản đồ API và kiểu dữ liệu.</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="font-semibold text-slate-950">Webhook không gửi</p>
            <p className="mt-2 text-sm text-slate-600">Kiểm tra URL webhook đã đăng ký trong cài đặt và đảm bảo nó có thể truy cập công khai.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function EndpointCard({
  method,
  path,
  title,
  description,
}: {
  method: string;
  path: string;
  title: string;
  description: string;
}) {
  const methodColor = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-green-100 text-green-700",
    PATCH: "bg-yellow-100 text-yellow-700",
    DELETE: "bg-red-100 text-red-700",
  }[method] || "bg-gray-100 text-gray-700";

  return (
    <div className="surface-panel flex items-start gap-4 p-5">
      <div className={`rounded px-3 py-1 text-sm font-semibold ${methodColor}`}>{method}</div>
      <div className="flex-1">
        <p className="font-mono text-sm font-semibold text-slate-950">{path}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
