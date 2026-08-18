# Phân quyền theo email và ủy quyền thẩm quyền phê duyệt

Hệ thống phân biệt ba lớp tài khoản. **Chủ sở hữu** được xác định bằng định danh chủ sở hữu của dự án, có toàn bộ quyền và là người duy nhất có thể mời nhân sự, đổi vai trò, cấp hoặc thu hồi quyền. **Quản trị viên** không có quyền mặc định đối với dữ liệu nhạy cảm; họ chỉ thực hiện được từng thẩm quyền mà chủ sở hữu đã cấp. **Nhân sự** có quyền nghiệp vụ cơ bản, không có quyền phê duyệt, khóa sổ hoặc xóa dữ liệu.

| Nhóm quyền | Chủ sở hữu | Quản trị viên | Nhân sự |
|---|---|---|---|
| Mời và cấp quyền bằng email | Toàn quyền | Không | Không |
| Phê duyệt khóa sổ / khóa, mở sổ | Toàn quyền | Khi được cấp riêng | Không |
| Phê duyệt báo cáo cấp 1/cấp 2 | Toàn quyền | Khi được cấp riêng | Không |
| Từ chối báo cáo, xóa dữ liệu | Toàn quyền | Khi được cấp riêng | Không |
| Ghi nhận nghiệp vụ cơ bản | Có | Có | Có |

Một lời mời được lưu theo địa chỉ email ở trạng thái chờ. Khi nhân sự đăng nhập bằng đúng email, hệ thống kích hoạt lời mời, gán vai trò và các quyền đã chỉ định. Mọi thao tác mời, cấp, thu hồi hoặc thay đổi vai trò đều phải được ghi vào nhật ký ủy quyền. Quy trình này là kiểm soát nội bộ; các quyền của quản trị viên không thay thế thẩm quyền pháp lý hoặc chữ ký số có chứng thư.

