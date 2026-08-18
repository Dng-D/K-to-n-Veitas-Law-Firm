# Quy trình phê duyệt hai cấp cho báo cáo kỳ

## Phạm vi

Quy trình này áp dụng sau khi kỳ kế toán đã ở trạng thái **đã khóa sổ**. Mục tiêu là tạo một hồ sơ xác nhận nội bộ cho phiên bản báo cáo đối chiếu không thể thay đổi mà không làm thay đổi hàm băm. Đây không phải là tích hợp chứng thư chữ ký số.

## Trạng thái

| Trạng thái | Ý nghĩa | Chuyển trạng thái |
|---|---|---|
| `draft` | Chưa có yêu cầu phê duyệt báo cáo. | Gửi cấp 1. |
| `pending_level_1` | Đang chờ người phê duyệt cấp 1. | Chấp thuận cấp 1 hoặc từ chối. |
| `pending_level_2` | Đã qua cấp 1, chờ người phê duyệt cấp 2. | Chấp thuận cấp 2 hoặc từ chối. |
| `rejected` | Một cấp đã từ chối và nêu lý do. | Gửi lại cấp 1 với hàm băm mới. |
| `internally_attested` | Đã đủ hai phê duyệt khác nhau; hồ sơ xác nhận nội bộ hoàn tất. | Chỉ tạo yêu cầu mới nếu cần lập phiên bản báo cáo mới. |

## Quy tắc phân tách nhiệm vụ

Người tạo yêu cầu, người phê duyệt cấp 1 và người phê duyệt cấp 2 phải là ba tài khoản khác nhau. Cấp 1 và cấp 2 chỉ dành cho tài khoản quản trị viên trong phiên bản hiện tại. Quy tắc này ưu tiên kiểm soát chặt chẽ; doanh nghiệp cần cấp thêm tài khoản quản trị viên có thẩm quyền nếu muốn hoàn tất luồng hai cấp.

## Bằng chứng nội bộ

Khi gửi yêu cầu, hệ thống chuẩn hóa dữ liệu đối chiếu của kỳ và tạo hàm băm SHA-256. Hồ sơ lưu mã hàm băm, thời điểm lập, người lập, thông tin hai cấp phê duyệt, ghi chú/từ chối và nhật ký hành động. Sau khi cấp 2 chấp thuận, trạng thái hiển thị là **Đã xác nhận nội bộ**; không gọi đây là “đã ký số bằng chứng thư”.

## Nhắc chốt sổ trên trang chủ

Banner nhắc chốt sổ được tính khi người dùng mở trang chủ, từ ngày 25 đến ngày cuối cùng của tháng theo múi giờ Việt Nam. Banner nêu số ngày còn lại, trạng thái kỳ hiện tại và các vấn đề đang chặn gửi phê duyệt. Đây là thông báo trong ứng dụng, không cần tiến trình nền, không gửi email/push notification và không tạo lịch chạy tự động.
