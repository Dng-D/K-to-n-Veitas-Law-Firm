# Trạng thái kết nối WordPress.com

**Cập nhật:** 18/08/2026

Kết nối WordPress cấp tác vụ đã được bật và tài khoản WordPress.com đang đăng nhập có hiển thị trang `vertiaslawketoan`. Tuy nhiên, lần kiểm tra quyền cho khả năng đọc danh sách site (`wpcom/user-sites`) vẫn bị WordPress.com từ chối với thông báo rằng khả năng này chưa được bật trong phần cài đặt MCP.

Trang cài đặt AI và MCP của tài khoản đang hiển thị 5/38 quyền đọc và 1/90 quyền ghi được bật. Trước khi hệ thống có thể xác minh site đích, soạn bản nháp hoặc tạo nội dung, người quản trị cần bật tối thiểu quyền **User Sites / Site Access** (đọc danh sách site) và quyền tạo **page/post draft** cho site Veritas Law Firm. Không có dữ liệu hoặc nội dung nào đã được truyền sang WordPress.com.

Khi rà soát giao diện tại `Preferences → AI and MCP → Read`, hai nhóm quyền cần thiết đang hiển thị là **Site** và **Content Authoring**. Cần bật quyền đọc cho cả hai nhóm; sau đó, tại `Write`, chỉ bật **Content Authoring** để cho phép tạo bản nháp trang/bài viết. Không cần bật toàn bộ quyền, quyền quản trị người dùng, plugin, tài khoản hoặc DNS cho yêu cầu này.

Sau khi hai nhóm trên được bật, khả năng `wpcom/user-sites` vẫn chưa được cấp. Danh sách thao tác mở rộng của nhóm **Site** gồm các quyền như đọc cấu hình site, thống kê, hoạt động và theme, nhưng không hiển thị khả năng liệt kê site. Cần tiếp tục rà soát nhóm **Other** để bật đúng khả năng `user-sites`, thay vì mở thêm quyền không cần thiết.

Rà soát nhóm **Other** chỉ cho thấy các thao tác liên quan đến AI Agent Access và Jetpack Search + Voice, không có khả năng liệt kê site. Vì vậy, không có quyền bổ sung rõ ràng nào trên giao diện để bật riêng `wpcom/user-sites`. Không nên bật toàn bộ 38 quyền đọc chỉ để vượt qua lỗi này; cần kiểm tra khả năng nội dung bằng site URL đã biết hoặc yêu cầu WordPress.com làm rõ ánh xạ quyền nếu cần.

## Xác thực thành công

Sau khi quyền **Account → List your sites** được bật, khả năng `wpcom/user-sites` đã hoạt động. Site đích được xác minh là **Veritas Law Firm** với blog ID `256811481`, URL `https://vertiaslawketoan.wordpress.com`, trạng thái active và công khai. Site đang ở trạng thái coming soon/chưa launched, thuộc giai đoạn MCP grace period 30 ngày; các công cụ site cốt lõi có thể hoạt động nhưng một số chức năng nâng cao có thể bị giới hạn. Bản nháp công khai đề xuất được lưu tại `docs/WORDPRESS_DRAFT.md`; chưa có bất kỳ nội dung nào được tạo trên WordPress.com.

## Bản nháp đã tạo

Đã tạo thành công trang **Veritas Finance Desk — Hệ thống quản trị kế toán nội bộ** với ID `6`, trạng thái `draft`. WordPress.com giữ nguyên nội dung Gutenberg được gửi và không trả về cảnh báo loại bỏ hoặc thay đổi block. Liên kết xem trước là `https://vertiaslawketoan.wordpress.com/?page_id=6`. Trang này chưa được xuất bản và cần một xác nhận riêng của người dùng trước bất kỳ thao tác công khai nào.

## Số liệu tổng hợp ẩn danh được duyệt để thêm vào bản nháp

Lần truy vấn tổng hợp ngày 18/08/2026 cho thấy hệ thống đang có 0 hồ sơ, doanh thu trước thuế 0 VND, đã thu 0 VND, chi phí trước thuế 0 VND, đã chi 0 VND, thực thu 0 VND và thực chi 0 VND. Không có dữ liệu chi tiết nào được truy vấn hoặc đưa vào nội dung công khai. Nội dung bổ sung đề xuất được lưu tại `docs/WORDPRESS_DRAFT.md` và cần xác nhận riêng trước khi cập nhật bản nháp WordPress hiện có.

## Kiểm tra xem trước

Bản nháp ID `6` đã được cập nhật thành công với bảng tổng hợp ẩn danh và vẫn giữ trạng thái `draft`. Liên kết xem trước đã được mở, kiểm tra trực quan và xác nhận hiển thị đúng toàn bộ nội dung, bao gồm bảng số liệu tổng hợp: `https://vertiaslawketoan.wordpress.com/?page_id=6&preview=true`. Phản hồi tạo/cập nhật của WordPress.com không có trường `_content_warnings`, do đó không có block hoặc nội dung nào bị loại bỏ. Không có thao tác xuất bản nào được thực hiện.
