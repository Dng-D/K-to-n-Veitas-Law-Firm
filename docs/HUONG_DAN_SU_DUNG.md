# Hướng dẫn sử dụng Veritas Finance Desk

## Mục đích

Veritas Finance Desk là ứng dụng quản lý tài chính nội bộ cho văn phòng dịch vụ pháp lý. Ứng dụng tổng hợp số liệu trực tiếp từ hồ sơ/hợp đồng, sổ doanh thu, sổ chi phí và nhật ký thu–chi để hiển thị các chỉ tiêu **tổng doanh thu**, **thực thu**, **thực chi**, **lợi nhuận**, **công nợ phải thu** và **công nợ phải trả**.

> Ứng dụng là công cụ quản trị và đối chiếu dữ liệu; không thay thế tờ khai thuế, báo cáo tài chính hoặc hồ sơ quyết toán chính thức. Trước khi ký, kê khai hoặc nộp hồ sơ, người phụ trách kế toán cần kiểm tra chứng từ gốc và quy định áp dụng tại thời điểm thực hiện.

## Trình tự ghi nhận dữ liệu

| Bước | Thao tác | Kết quả |
|---|---|---|
| 1 | Tạo **Hồ sơ / Hợp đồng** với mã hồ sơ, khách hàng, luật sư phụ trách và giá trị hợp đồng. | Tạo điểm liên kết chung cho doanh thu, chi phí và dòng tiền. |
| 2 | Ghi nhận tại **Sổ doanh thu** theo hóa đơn hoặc thời điểm cung cấp dịch vụ; chọn nhóm doanh thu và tài khoản theo dõi. | Hệ thống tính thuế GTGT đầu ra, tổng phải thu, số đã thu và công nợ phải thu. |
| 3 | Ghi nhận tại **Sổ chi phí** theo chứng từ nhà cung cấp; chọn nhóm chi phí chuẩn, tài khoản theo dõi và diễn giải chi tiết. | Hệ thống tính thuế GTGT đầu vào, tổng thanh toán, đã trả và công nợ phải trả. |
| 4 | Ghi nhận tại **Nhật ký thu–chi** khi tiền thực tế vào/ra quỹ hoặc tài khoản ngân hàng; chọn tài khoản và nhóm nghiệp vụ. | Dashboard và báo cáo cập nhật thực thu, thực chi, dòng tiền thuần và chênh lệch đối chiếu. |
| 5 | Rà soát **Báo cáo theo kỳ** theo Q1–Q4, 6 tháng hoặc cả năm. | So sánh doanh thu, chi phí, dòng tiền, công nợ và các chênh lệch giữa sổ nghiệp vụ với dòng tiền thực tế. |

## Danh mục tài khoản và nhóm nghiệp vụ

Các mã trong ứng dụng là **danh mục quản trị đã chuẩn hóa** để nối dữ liệu giữa ba sổ. Việc chọn mã không tự tạo bút toán kế toán hoặc thay thế quyết định hạch toán của người phụ trách; trước khi khóa sổ hoặc lập hồ sơ chính thức, kế toán vẫn cần kiểm tra chứng từ gốc và nguyên tắc áp dụng cho doanh nghiệp.

| Nhóm sổ | Danh mục trong ứng dụng | Mục đích quản trị |
|---|---|---|
| Nhật ký thu–chi | 1111, 1121, 131, 331, 3331, 5113, 642; kèm các nhóm thu/chi như phí dịch vụ pháp lý, lương, văn phòng, công nghệ, công tác phí và thuế/phí. | Theo dõi dòng tiền, loại giao dịch và khoản cần đối chiếu. |
| Sổ doanh thu | 5113, 515, 711; kèm nhóm dịch vụ pháp lý, phí duy trì, tố tụng, tư vấn, hoàn ứng/hoàn trả và khoản thu khác. | Chuẩn hóa nguồn doanh thu theo hóa đơn hoặc dịch vụ. |
| Sổ chi phí | 635, 642, 811; kèm nhóm lương, văn phòng, công nghệ, công tác phí, thuế/phí, dịch vụ chuyên môn và chi phí khác. | Chuẩn hóa khoản chi, đồng thời vẫn giữ trường diễn giải chi tiết của chứng từ. |

## Đối chiếu liên sổ

Tại **Báo cáo theo kỳ**, khu vực **Đối chiếu liên sổ** so sánh số tiền đã thu tại sổ doanh thu với các giao dịch thực thu, và số đã trả tại sổ chi phí với các giao dịch thực chi trong cùng kỳ. Chênh lệch khác 0 đồng không tự động xác định sai sót; đây là tín hiệu để kiểm tra thời điểm ghi nhận, chứng từ gốc, giao dịch chưa ghi vào nhật ký hoặc giao dịch được ghi sai loại đối chiếu.

| Chỉ tiêu cần kiểm tra | Diễn giải | Hành động rà soát tối thiểu |
|---|---|---|
| Chênh lệch thực thu | Thực thu tại nhật ký trừ số đã thu tại sổ doanh thu. | Đối chiếu số tiền, ngày hạch toán, số hóa đơn và sao kê/ngân hàng. |
| Chênh lệch thực chi | Thực chi tại nhật ký trừ số đã trả tại sổ chi phí. | Đối chiếu chứng từ nhà cung cấp, số phiếu chi/ủy nhiệm chi và sao kê. |
| Giao dịch chưa gắn loại đối chiếu | Giao dịch thu–chi chọn loại **Khác**. | Phân loại lại thành doanh thu, chi phí hoặc lưu lý do nghiệp vụ. |
| Giao dịch chưa đối chiếu | Giao dịch chưa đánh dấu đã khớp sao kê/sổ quỹ. | Chỉ đánh dấu sau khi kiểm tra chứng từ gốc và nguồn đối chiếu. |

## Xuất dữ liệu và chứng từ đính kèm

Tại **Báo cáo theo kỳ**, chọn đúng kỳ báo cáo rồi nhấn **Xuất Excel** hoặc **Xuất PDF**. Tệp xuất chứa các chỉ tiêu tổng hợp và bảng doanh thu, chi phí, dòng tiền theo từng tháng của kỳ đang xem. Tại **Nhật ký thu–chi**, hai nút xuất tạo sổ thu–chi từ toàn bộ giao dịch đã ghi nhận, bao gồm ngày giao dịch, loại thu/chi, nhóm nghiệp vụ, tài khoản theo dõi, diễn giải, hồ sơ, chứng từ, phương thức, số tiền và trạng thái đối chiếu.

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

## Căn cứ và giới hạn áp dụng

Thông tư 133/2016/TT-BTC hướng dẫn nguyên tắc ghi sổ kế toán, lập và trình bày báo cáo tài chính đối với doanh nghiệp nhỏ và vừa; đồng thời nêu rõ thông tư không áp dụng để xác định nghĩa vụ thuế. Văn bản này cho phép doanh nghiệp thiết kế mẫu chứng từ và sổ kế toán phù hợp đặc điểm hoạt động nhưng phải bảo đảm thông tin đầy đủ, rõ ràng và dễ kiểm tra, kiểm soát. Với tiền, văn bản yêu cầu ghi chép liên tục theo trình tự phát sinh và đối chiếu với chứng từ quỹ/ngân hàng.[1]

> Veritas Finance Desk là công cụ quản trị và kiểm soát nội bộ. Báo cáo quý, 6 tháng và năm trong ứng dụng là **báo cáo quản trị**, không phải báo cáo tài chính, quyết toán thuế hoặc bộ hồ sơ nộp cơ quan nhà nước. Kế toán phụ trách phải xác nhận chế độ kế toán doanh nghiệp đang áp dụng, thời hạn nộp và biểu mẫu pháp lý hiện hành trước khi ký, kê khai hoặc nộp hồ sơ.

## Tài liệu tham khảo

[1]: https://thuvienphapluat.vn/van-ban/Doanh-nghiep/Thong-tu-133-2016-TT-BTC-huong-dan-che-do-ke-toan-doanh-nghiep-nho-va-vua-284997.aspx "Thông tư 133/2016/TT-BTC — hướng dẫn chế độ kế toán doanh nghiệp nhỏ và vừa"
