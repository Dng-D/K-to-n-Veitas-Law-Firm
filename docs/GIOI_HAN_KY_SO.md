# Giới hạn của hồ sơ ký nội bộ và chữ ký số

## Phân định triển khai

Tính năng trong phiên bản này tạo **hồ sơ phê duyệt điện tử nội bộ**: định danh người phê duyệt, thời điểm, trạng thái, nội dung xác nhận và hàm băm của tập dữ liệu báo cáo. Cơ chế này hỗ trợ kiểm soát, truy vết và phát hiện thay đổi dữ liệu sau phê duyệt; nó **không được gắn nhãn là chữ ký số có chứng thư** và không thay thế bước ký bằng chứng thư do tổ chức cung cấp dịch vụ tin cậy hoặc cơ quan/tổ chức có thẩm quyền cấp.

Nghị định 23/2025/NĐ-CP được ban hành ngày 21/02/2025 và có hiệu lực từ 10/04/2025, quy định về chữ ký điện tử và dịch vụ tin cậy.[1] [2] Nguồn chính thức nêu rằng chữ ký số công cộng được bảo đảm bởi chứng thư chữ ký số công cộng và việc dùng chữ ký số của tổ chức/người có thẩm quyền chỉ thực hiện trong phạm vi thẩm quyền, chức danh ghi nhận trên chứng thư.[2]

> Chỉ kích hoạt trạng thái “đã ký số bằng chứng thư” sau khi hoàn thành tích hợp với nhà cung cấp phù hợp, xác thực chủ thể ký, kiểm tra hiệu lực chứng thư và lưu được dữ liệu xác thực chữ ký theo giao diện/tài liệu kỹ thuật của nhà cung cấp.

## Điều kiện để tích hợp chứng thư số thực tế

| Điều kiện | Yêu cầu trước khi tích hợp |
|---|---|
| Nhà cung cấp | Người dùng xác định nhà cung cấp chữ ký số/dịch vụ tin cậy và cung cấp tài liệu API hoặc SDK chính thức. |
| Xác thực | Cung cấp quyền truy cập, khóa API hoặc cơ chế OAuth qua quản lý bí mật; không đưa khóa riêng hoặc mã PIN vào mã nguồn hay cơ sở dữ liệu ứng dụng. |
| Kiểm tra | Xác nhận quy trình xác thực chủ thể, hiệu lực chứng thư, kết quả kiểm tra chữ ký và cơ chế lưu dữ liệu kèm theo thông điệp ký. |
| Phạm vi | Xác định người ký, thẩm quyền, loại báo cáo được ký, chính sách ủy quyền và thời hạn lưu trữ. |

## Trạng thái hệ thống hiện tại

Ứng dụng chỉ ghi nhận **phê duyệt nội bộ có kiểm soát** và hiển thị rõ đây là hồ sơ nội bộ. Khi tích hợp chứng thư số, trạng thái và bằng chứng xác thực của nhà cung cấp phải được lưu tách biệt với phê duyệt nội bộ để tránh suy diễn sai về giá trị pháp lý.

## Tài liệu tham khảo

[1]: https://vanban.chinhphu.vn/?pageid=27160&docid=212829 "Nghị định 23/2025/NĐ-CP về chữ ký điện tử và dịch vụ tin cậy"
[2]: https://baochinhphu.vn/quy-dinh-moi-ve-chu-ky-dien-tu-va-dich-vu-tin-cay-102250224160649632.htm "Quy định mới về chữ ký điện tử và dịch vụ tin cậy — Báo Điện tử Chính phủ"
