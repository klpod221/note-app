# Note App

```text
/note-app/
├── public/
│   └── (favicon, hình ảnh, …)
│
├── app/
│   ├── (auth)/                # Các route cho xác thực (đăng nhập, đăng ký)
│   │   ├── login/
│   │   │   └── page.jsx       # Trang đăng nhập
│   │   └── register/
│   │       └── page.jsx       # Trang đăng ký
│   │
│   ├── (private)/             # Các route dành cho người dùng đã đăng nhập
│   │   ├── dashboard/
│   │   │   └── page.jsx       # Trang tổng quan (Dashboard)
│   │   ├── notes/             # Quản lý Notes/Todo
│   │   │   ├── page.jsx       # Danh sách ghi chú
│   │   │   ├── new/
│   │   │   │   └── page.jsx   # Tạo mới ghi chú/Todo
│   │   │   └── [id]/          # Xem/Chỉnh sửa ghi chú/Todo (dựa vào id)
│   │   │       └── page.jsx
│   │   ├── users/             # Quản lý người dùng (chỉ admin)
│   │   │   ├── page.jsx       # Danh sách người dùng
│   │   │   └── [id]/edit.jsx  # Chỉnh sửa thông tin người dùng
│   │   └── settings/          # Quản lý cấu hình (chỉ admin)
│   │       └── page.jsx       # Trang cài đặt hệ thống
│   │
│   ├── layout.jsx             # Layout chung
│   └── page.jsx               # Landing page
│
├── components/                # Các component dùng lại nhiều lần
│   ├── Auth/
│   │   └── AuthGuard.jsx      # Bảo vệ các route private
│   ├── Editor/
│   │   ├── MarkdownEditor.jsx # Editor (Monaco, …)
│   │   └── MarkdownPreview.jsx# Preview hiển thị markdown theo style GitHub
│   ├── Notes/
│   │   ├── NoteCard.jsx       # Card hiển thị thông tin ghi chú
│   │   ├── NoteList.jsx       # Danh sách ghi chú (dạng grid hoặc list)
│   │   └── NoteToolbar.jsx    # Toolbar thao tác với ghi chú (search, filter, …)
│   ├── Users/
│   │   └── UserTable.jsx      # Table hiển thị danh sách user
│   ├── Settings/
│   │   └── SettingsForm.jsx   # Form cấu hình hệ thống
│   └── UI/
│       └── LoadingSpinner.jsx # Component loading, Spin (có thể sử dụng Ant Design)
│
├── lib/                       # Các helper, utilities
│   ├── dbConnect.js           # Kết nối MongoDB
│   ├── auth.js                # Các hàm xác thực, kiểm tra quyền
│   ├── socket.js              # Quản lý Socket.IO client
│   ├── api.js                 # Axios instance cho các API call
│   └── utils.js               # Các hàm tiện ích khác
│
├── models/                    # Mongoose models
│   ├── User.js
│   ├── Note.js               # Model ghi chú (bao gồm Todo nếu có type "todo")
│   └── Setting.js
│
├── services/                  # Business logic (tách riêng ra controller nếu cần)
│   ├── authService.js
│   ├── noteService.js
│   ├── userService.js
│   └── settingService.js
│
├── api/                       # API Routes (Next.js App Router)
│   ├── auth/
│   │   ├── login/route.js
│   │   ├── register/route.js
│   │   └── logout/route.js
│   ├── notes/
│   │   ├── [id]/route.js      # API chỉnh sửa, lấy chi tiết ghi chú
│   │   └── route.js           # API tạo, lấy danh sách ghi chú
│   ├── users/
│   │   ├── [id]/route.js      # API chỉnh sửa, xóa người dùng
│   │   └── route.js           # API lấy danh sách người dùng
│   └── settings/route.js      # API cấu hình hệ thống
│
├── middleware.js              # Middleware toàn cục cho Next.js
├── socket-server.js           # Cấu hình và khởi tạo Socket.IO server (chạy bên cạnh Next.js)
│
├── tailwind.config.js
├── next.config.js
├── package.json
├── README.md
└── .env.local                # Các biến môi trường

```