# Hướng dẫn sử dụng Veritas Finance Desk

## Mục đích

Veritas Finance Desk là ứng dụng quản lý tài chính nội bộ cho văn phòng dịch vụ pháp lý. Ứng dụng tổng hợp số liệu trực tiếp từ hồ sơ/hợp đồng, sổ doanh thu, sổ chi phí và nhật ký thu–chi để hiển thị các chỉ tiêu **tổng doanh thu**, **thực thu**, **thực chi**, **lợi nhuận**, **công nợ phải thu** và **công nợ phải trả**.

> Ứng dụng là công cụ quản trị và đối chiếu dữ liệu; không thay thế tờ khai thuế, báo cáo tài chính hoặc hồ sơ quyết toán chính thức. Trước khi ký, kê khai hoặc nộp hồ sơ, người phụ trách kế toán cần kiểm tra chứng từ gốc và quy định áp dụng tại thời điểm thực hiện.

## Trình tự ghi nhận dữ liệu

| Bước | Thao tác | Kết quả |
|---|---|---|
| 1 | Tạo **Hồ sơ / Hợp đồng** với mã hồ sơ, khách hàng, luật sư phụ trách và giá trị hợp đồng. | Tạo điểm liên kết chung cho doanh thu, chi phí và dòng tiền. |
| 2 | Ghi nhận tại **Sổ doanh thu** theo hóa đơn hoặc thời điểm cung cấp dịch vụ. | Hệ thống tính thuế GTGT đầu ra, tổng phải thu, số đã thu và công nợ phải thu. |
| 3 | Ghi nhận tại **Sổ chi phí** theo chứng từ nhà cung cấp. | Hệ thống tính thuế GTGT đầu vào, tổng thanh toán, đã trả và công nợ phải trả. |
| 4 | Ghi nhận tại **Nhật ký thu–chi** khi tiền thực tế vào/ra quỹ hoặc tài khoản ngân hàng. | Dashboard và báo cáo cập nhật thực thu, thực chi và dòng tiền thuần. |
| 5 | Rà soát **Báo cáo theo kỳ** theo Q1–Q4, 6 tháng hoặc cả năm. | So sánh doanh thu, chi phí, dòng tiền và công nợ theo kỳ. |

## Xuất dữ liệu và chứng từ đính kèm

Tại **Báo cáo theo kỳ**, chọn đúng kỳ báo cáo rồi nhấn **Xuất Excel** hoặc **Xuất PDF**. Tệp xuất chứa các chỉ tiêu tổng hợp và bảng doanh thu, chi phí, dòng tiền theo từng tháng của kỳ đang xem. Tại **Nhật ký thu–chi**, hai nút xuất tạo sổ thu–chi từ toàn bộ giao dịch đã ghi nhận, bao gồm ngày giao dịch, loại thu/chi, diễn giải, hồ sơ, chứng từ, phương thức, số tiền và trạng thái đối chiếu.

Để đính kèm hóa đơn hoặc chứng từ cho một dòng thu–chi đã tạo, nhấn biểu tượng kẹp giấy tại cột **Tệp**. Hệ thống chấp nhận tệp **PDF, JPG, PNG và WEBP**, với dung lượng không quá **8 MB** mỗi tệp. Tệp được lưu theo từng giao dịch; có thể mở lại từ cửa sổ chứng từ đính kèm. Không tải lên tài liệu không liên quan đến giao dịch hoặc có dữ liệu nhạy cảm vượt quá phạm vi cần thiết cho chứng từ kế toán.

## Phân quyền

| Thao tác | Chủ sở hữu (admin) | Nhân viên kế toán |
|---|---:|---:|
| Xem dashboard và báo cáo | Có | Có |
| Tạo/chỉnh sửa hồ sơ, doanh thu, chi phí, thu–chi | Có | Có |
| Xóa dữ liệu nghiệp vụ | Có | Không |
| Quản trị quyền tài khoản | Có | Không |

Vai trò `admin` được gán cho chủ sở hữu dự án khi đăng nhập lần đầu. Các tài khoản khác mặc định có vai trò `user`, được hiển thị trong giao diện là **Nhân viên kế toán**.

## Nguyên tắc kiểm soát

Không dùng ngày thu tiền để thay thế cho ngày cung cấp dịch vụ hoặc ngày hóa đơn. Với từng dòng doanh thu và chi phí, nên ghi đầy đủ mã hồ sơ, số hóa đơn, ngày chứng từ, giá trị trước thuế, thuế GTGT và ghi chú hồ sơ. Các giao dịch trong nhật ký thu–chi nên được đánh dấu **Đã đối chiếu** chỉ sau khi khớp với sao kê ngân hàng hoặc sổ quỹ.

Khi cần hiệu chỉnh dữ liệu, ưu tiên cập nhật bản ghi hiện hữu thay vì xóa. Quyền xóa chỉ dành cho chủ sở hữu nhằm hạn chế rủi ro mất dữ liệu và duy trì khả năng kiểm tra nội bộ.
