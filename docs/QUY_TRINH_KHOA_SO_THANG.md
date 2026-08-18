# Quy trình phê duyệt và khóa sổ tháng

## Mục đích và phạm vi

Quy trình này kiểm soát dữ liệu doanh thu, chi phí và nhật ký thu–chi theo từng tháng dương lịch trong hệ thống Veritas Finance Desk. Đây là **cơ chế quản trị nội bộ**, không thay thế việc lập báo cáo tài chính, kê khai thuế hoặc quyết toán theo hồ sơ chứng từ gốc.

## Vai trò và nguyên tắc phân tách nhiệm vụ

| Vai trò | Quyền trong quy trình |
|---|---|
| Nhân viên kế toán | Khởi tạo kỳ, rà soát chỉ tiêu, gửi yêu cầu phê duyệt và nhận lý do từ chối. |
| Chủ sở hữu / quản trị viên | Phê duyệt hoặc từ chối kỳ, khóa sổ và chỉ mở lại kỳ đã khóa khi ghi rõ lý do. |

Người phê duyệt không được phê duyệt yêu cầu do chính mình tạo. Quy tắc này hỗ trợ phân tách nhiệm vụ; nếu doanh nghiệp chỉ có một người vận hành, cần thiết lập một tài khoản người lập riêng trước khi thực hiện khóa sổ.

## Trạng thái kỳ kế toán

| Trạng thái | Ý nghĩa | Chuyển trạng thái được phép |
|---|---|---|
| `open` | Kỳ đang mở, cho phép ghi nhận và cập nhật dữ liệu. | Gửi phê duyệt. |
| `pending_approval` | Đã gửi phê duyệt và chờ quản trị viên. | Phê duyệt hoặc từ chối. |
| `rejected` | Bị từ chối, cần sửa dữ liệu theo ghi chú. | Gửi lại phê duyệt. |
| `approved` | Số liệu đã được phê duyệt, sẵn sàng khóa. | Khóa sổ. |
| `locked` | Sổ tháng đã khóa; mọi tạo, sửa, xóa và đính kèm chứng từ thuộc kỳ bị chặn. | Mở lại có lý do. |

## Điều kiện trước khi gửi phê duyệt

Hệ thống yêu cầu không còn giao dịch thu–chi chưa đối chiếu, chưa phân loại loại đối chiếu hoặc thiếu số chứng từ. Bảng đối chiếu liên sổ phải có chênh lệch thực thu và thực chi bằng 0. Các điều kiện này không thay thế trách nhiệm kiểm tra chứng từ gốc, hóa đơn và sao kê.

## Nhật ký kiểm soát

Mọi thao tác tạo kỳ, gửi phê duyệt, phê duyệt, từ chối, khóa sổ và mở lại đều được ghi nhận cùng người thao tác, thời điểm và ghi chú. Báo cáo đối chiếu được xuất dưới dạng Excel/PDF chỉ phản ánh trạng thái tại thời điểm xuất.

> Việc lập, kiểm tra và lưu trữ chứng từ, sổ kế toán vẫn phải tuân theo chế độ kế toán doanh nghiệp đang áp dụng, bao gồm các hướng dẫn tại [Thông tư 133/2016/TT-BTC](https://thuvienphapluat.vn/van-ban/Doanh-nghiep/Thong-tu-133-2016-TT-BTC-huong-dan-che-do-ke-toan-doanh-nghiep-nho-va-vua-284997.aspx).
