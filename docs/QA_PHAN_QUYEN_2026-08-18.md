# Biên bản kiểm tra giao diện phân quyền

| Hạng mục | Đường dẫn | Kết quả | Ghi nhận |
|---|---|---|---|
| Quản lý quyền theo email | `/quyen-truy-cap` | Đạt | Hiển thị biểu mẫu mời email, vai trò dự kiến, danh mục người có thẩm quyền phê duyệt, danh mục tài khoản và nhật ký ủy quyền. |
| Phê duyệt và khóa sổ | `/ky-ke-toan` | Đạt | Luồng trạng thái hiển thị đúng; người lập nhận cảnh báo không tự phê duyệt và nội dung dùng thuật ngữ thẩm quyền được ủy quyền. |
| Phê duyệt báo cáo | `/phe-duyet-bao-cao` | Đạt | Hiển thị điều kiện bắt buộc khóa sổ trước khi tạo hồ sơ phê duyệt hai cấp. |

Kiểm tra được thực hiện ở khung nhìn máy tính **1280 × 720** ngày 18/08/2026. Các hành vi cập nhật quyền nhạy cảm được bảo vệ thêm tại máy chủ và được bao phủ bởi bộ kiểm thử Vitest.
