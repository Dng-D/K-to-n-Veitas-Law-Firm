# Biên bản kiểm tra giao diện phân quyền

| Hạng mục | Đường dẫn | Khung nhìn đã kiểm tra | Kết quả | Ghi nhận |
|---|---|---|---|---|
| Quản lý quyền theo email | `/quyen-truy-cap` | 1280 × 720; 768 × 1024; 375 × 812 | Đạt | Biểu mẫu mời email, vai trò dự kiến, danh mục người có thẩm quyền phê duyệt, danh mục tài khoản và nhật ký ủy quyền xếp một cột trên di động; không có tràn ngang. |
| Phê duyệt và khóa sổ | `/ky-ke-toan` | 1280 × 720; 768 × 1024; 375 × 812 | Đạt | Trạng thái kỳ, điều kiện đối chiếu, cảnh báo phân tách nhiệm vụ và danh mục chứng từ tiếp tục đọc được ở màn hình nhỏ; các nút xuất và chọn tháng tự xuống dòng. |
| Phê duyệt báo cáo | `/phe-duyet-bao-cao` | 1280 × 720; 768 × 1024; 375 × 812 | Đạt | Cảnh báo yêu cầu khóa sổ, nút điều hướng và thông tin giới hạn xác nhận nội bộ hiển thị rõ ở cả máy tính bảng và điện thoại. |

Kiểm tra được thực hiện ngày 18–19/08/2026. Ở máy tính bảng, điều hướng bên trái duy trì khả năng sử dụng mà không che nội dung. Ở điện thoại, thanh điều hướng thu gọn, nội dung chuyển sang một cột, và không ghi nhận tràn ngang. Các hành vi cập nhật quyền nhạy cảm được bảo vệ thêm tại máy chủ và được bao phủ bởi bộ kiểm thử Vitest.

Ngày 19/08/2026, trang `/quyen-truy-cap` được kiểm tra lại ở **1280 × 720** và **375 × 812** sau khi thêm gửi email Gmail, bộ tìm kiếm, lọc vai trò/trạng thái, trạng thái lời mời và trường thời hạn thẩm quyền. Hai khung nhìn đều đạt: biểu mẫu, bộ lọc và danh mục tài khoản tự xuống dòng, không tràn ngang. Kiểm thử SMTP Gmail xác thực thành công; toàn bộ Vitest đạt **26/26** và TypeScript không lỗi.

Tác vụ production `TBbdeg8XKQMhAQ2AiUv88M` đã chạy thành công lúc 18:47:19 UTC ngày 18/08/2026, phản hồi HTTP **200** với nội dung `{"ok":true,"revoked":0}`. Điều này xác nhận endpoint `/api/scheduled/revoke-expired-access` được gọi đúng và an toàn khi chưa có quyền hết hạn để thu hồi.

Chủ sở hữu đã xác nhận yêu cầu đặt thời hạn độc lập theo từng thẩm quyền. Lớp dữ liệu và API đã nhận `permissionExpiries`; biểu mẫu quản trị đang được hoàn thiện để hiển thị lựa chọn này trực tiếp cho từng quyền.

Biểu mẫu hoàn thiện cho phép chọn từng quyền và nhập thời hạn riêng bên cạnh quyền đó, áp dụng cho cả lời mời Gmail lẫn quản trị viên hiện hữu. Kiểm tra ngày 19/08/2026 tại **1280 × 720** và **375 × 812** cho thấy bố cục không tràn ngang; toàn bộ 26 kiểm thử Vitest và kiểm tra TypeScript đạt.

Phiên bản giao diện thời hạn riêng từng quyền được đồng bộ lên nhánh `main` của GitHub bằng commit `4b0e4f5`; checkpoint triển khai tương ứng là `0fc8f522`.
