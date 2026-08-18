# Biên bản QA giao diện đáp ứng

**Ngày kiểm thử:** 18/08/2026  
**Phạm vi:** Bảy màn hình chính của Veritas Finance Desk, bao gồm dashboard, hồ sơ, doanh thu, chi phí, nhật ký thu–chi, báo cáo theo kỳ và quyền truy cập.  
**Môi trường:** Máy chủ phát triển dự án; dữ liệu nghiệp vụ tại thời điểm kiểm thử trống.  
**Breakpoints đã kiểm tra:** Desktop 1280 × 720 và mobile 375 × 812.

> Biên bản này xác nhận khả năng hiển thị và điều hướng ở dữ liệu trống. Các phép tính nghiệp vụ, phân quyền máy chủ và kiểm soát danh mục được kiểm tra riêng bằng Vitest; luồng chỉnh sửa một giao dịch có dữ liệu thật cần được người vận hành xác nhận trong môi trường có dữ liệu trước khi áp dụng vào quy trình kế toán thực tế.

| Route | Kiểm tra desktop 1280 × 720 | Kiểm tra mobile 375 × 812 | Kết quả | Ghi nhận |
|---|---|---|---|---|
| `/` | KPI, biểu đồ trạng thái trống, số dư dòng tiền theo kỳ và khu vực cảnh báo hiển thị. | KPI xếp dọc; số dư dòng tiền và cảnh báo vẫn đọc được, không che nội dung. | Pass | Chỉ tiêu số dư được gắn rõ là chưa bao gồm số dư đầu kỳ. |
| `/ho-so` | Tiêu đề, nút tạo hồ sơ và bảng trống hiển thị đúng. | Nút tạo hồ sơ chiếm chiều rộng phù hợp; trạng thái trống không tràn màn hình. | Pass | Bảng được đặt trong vùng cuộn ngang khi có nhiều cột. |
| `/doanh-thu` | Bảng có cột nhóm/tài khoản; thông điệp trống hiển thị đúng. | Tiêu đề và nút ghi nhận hiển thị rõ; bảng giữ khả năng cuộn ngang. | Pass | Không có dữ liệu mẫu được tạo. |
| `/chi-phi` | Bảng chi phí và trạng thái trống hiển thị đúng. | Nội dung tiêu đề và nút ghi nhận vừa màn hình; bảng giữ vùng cuộn ngang. | Pass | Không có dữ liệu mẫu được tạo. |
| `/thu-chi` | Bộ lọc ngày, loại, khách hàng và hồ sơ; nút xuất và nút ghi nhận hiển thị đúng. | Các bộ lọc xếp dọc, các nút không chồng lấp; bảng dùng cuộn ngang thay vì ép hẹp cột. | Pass | Không có giao dịch để kiểm thử thao tác sửa trực quan; API cập nhật được kiểm thử bằng Vitest. |
| `/bao-cao` | Bộ chọn kỳ, KPI, đối chiếu liên sổ và biểu đồ/trạng thái trống hiển thị đúng. | Thẻ đối chiếu liên sổ và các chỉ tiêu thu/chi hiển thị tuần tự, dễ đọc. | Pass | Chênh lệch được trình bày bằng số tiền và trạng thái. |
| `/quyen-truy-cap` | Thẻ tài khoản và ma trận quyền hiển thị đúng. | Ma trận quyền vẫn đọc được trong vùng nội dung; không che phần điều hướng. | Pass | Kiểm thử khi chưa có hồ sơ đăng nhập chi tiết chỉ hiển thị trạng thái mặc định. |

## Kết luận

Tất cả bảy route chính đã được chụp và rà soát tại hai breakpoint nêu trên. Không phát hiện lỗi chặn hiển thị ở dữ liệu trống. Với các bảng có nhiều cột, thiết kế giữ vùng cuộn ngang trên màn hình hẹp để không làm mất nội dung; đây là hành vi có chủ đích. Việc tạo, sửa và đối chiếu giao dịch với dữ liệu thực vẫn cần được kế toán phụ trách thực hiện kiểm thử chấp nhận trước khi đưa số liệu vào quy trình khóa sổ.
