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

## Phê duyệt và khóa sổ tháng

Tại **Phê duyệt & khóa sổ**, chọn đúng tháng cần kiểm soát. Hệ thống hiển thị năm điều kiện trước khi gửi phê duyệt: chênh lệch thực thu, chênh lệch thực chi, giao dịch chờ phân loại, giao dịch chưa đối chiếu và giao dịch thiếu số chứng từ. Chỉ khi cả năm điều kiện đạt, nút **Gửi phê duyệt** mới có thể được sử dụng.

| Bước | Người thực hiện | Thao tác | Kết quả |
|---|---|---|---|
| 1 | Nhân viên kế toán | Rà soát bảng điều kiện, số chứng từ, sao kê/sổ quỹ và danh mục chứng từ. | Kỳ vẫn ở trạng thái **Đang mở**. |
| 2 | Nhân viên kế toán | Nhấn **Gửi phê duyệt** sau khi các điều kiện đạt. | Kỳ chuyển thành **Chờ phê duyệt** và hệ thống ghi nhật ký thao tác. |
| 3 | Tài khoản có quyền **Phê duyệt kỳ** khác người gửi | Nhấn **Phê duyệt kỳ** hoặc **Từ chối** và nhập lý do nếu từ chối. | Kỳ chuyển thành **Đã phê duyệt** hoặc **Bị từ chối**. |
| 4 | Tài khoản có quyền **Khóa sổ tháng** | Nhấn **Khóa sổ tháng** sau khi đã phê duyệt. | Kỳ chuyển thành **Đã khóa sổ**; mọi tạo, sửa, xóa và đính kèm chứng từ thuộc tháng này bị chặn ở hệ thống. |
| 5 | Tài khoản có quyền **Mở lại kỳ** | Chỉ dùng **Mở lại kỳ** khi cần điều chỉnh có căn cứ, đồng thời nhập lý do. | Kỳ trở lại **Đang mở** và lý do được lưu trong dấu vết kiểm soát. |

Người gửi yêu cầu không thể tự phê duyệt kỳ của mình. Nếu doanh nghiệp có một người vận hành, cần có một tài khoản người lập riêng để duy trì nguyên tắc phân tách nhiệm vụ. Không khóa sổ nếu chưa kiểm tra chứng từ gốc; trạng thái “Đạt” chỉ phản ánh các điều kiện dữ liệu mà hệ thống kiểm tra tự động.

## Phê duyệt báo cáo hai cấp và hồ sơ xác nhận nội bộ

Sau khi kỳ đã **khóa sổ**, mở **Phê duyệt báo cáo**. Người lập nhấn **Gửi phê duyệt cấp 1** để hệ thống tạo ảnh chụp dữ liệu đối chiếu và mã hàm băm SHA-256. Một tài khoản khác người lập, có quyền **Phê duyệt báo cáo cấp 1**, thực hiện bước kiểm tra đầu tiên; một tài khoản thứ ba, khác cả người lập và cấp 1, có quyền **Phê duyệt báo cáo cấp 2**, thực hiện xác nhận hoàn tất. Khi hoàn tất, trạng thái là **Đã xác nhận nội bộ** và có thể xuất biên bản PDF/Excel.

| Thao tác | Quy tắc kiểm soát |
|---|---|
| Gửi yêu cầu | Chỉ áp dụng cho kỳ đã khóa sổ. Hệ thống lưu mã hàm băm, người lập và thời điểm tạo. |
| Cấp 1 | Không do người lập tự thực hiện. |
| Cấp 2 | Không do người lập hoặc người phê duyệt cấp 1 thực hiện. |
| Từ chối | Nhập lý do; người lập có thể lập yêu cầu mới sau khi xử lý. |
| Xuất biên bản | Lưu cùng hồ sơ kiểm soát kỳ; tệp gồm trạng thái, mã hàm băm và dấu vết hai cấp. |

> Tính năng hiện tại là **hồ sơ phê duyệt điện tử nội bộ**, không phải tuyên bố đã ký số bằng chứng thư. Chỉ coi báo cáo đã ký số khi có tích hợp nhà cung cấp chữ ký số, xác thực chủ thể ký và kiểm tra hiệu lực chứng thư. Xem `docs/GIOI_HAN_KY_SO.md` để biết điều kiện tích hợp.

## Nhắc chốt sổ trên trang chủ

Từ ngày 25 đến ngày cuối tháng theo múi giờ Việt Nam, trang chủ hiển thị banner **Nhắc chốt sổ**. Banner nêu số ngày còn lại, trạng thái kỳ và các điều kiện đang chặn gửi phê duyệt. Nếu kỳ đã khóa, banner chuyển thành liên kết đến **Phê duyệt báo cáo**. Đây là thông báo trong ứng dụng, chỉ hiển thị khi người dùng mở trang chủ; hệ thống không gửi email hoặc thông báo đẩy tự động.

## Xuất dữ liệu và chứng từ đính kèm

Tại **Báo cáo theo kỳ**, chọn đúng kỳ báo cáo rồi nhấn **Xuất Excel** hoặc **Xuất PDF**. Tệp xuất chứa các chỉ tiêu tổng hợp và bảng doanh thu, chi phí, dòng tiền theo từng tháng của kỳ đang xem. Tại **Nhật ký thu–chi**, hai nút xuất tạo sổ thu–chi từ toàn bộ giao dịch đã ghi nhận, bao gồm ngày giao dịch, loại thu/chi, nhóm nghiệp vụ, tài khoản theo dõi, diễn giải, hồ sơ, chứng từ, phương thức, số tiền và trạng thái đối chiếu.

Tại **Phê duyệt & khóa sổ**, nút **Xuất Excel** và **Xuất PDF** tạo **Báo cáo đối chiếu chứng từ và sổ sách** cho đúng tháng đã chọn. Báo cáo có trạng thái kỳ, chỉ tiêu đối chiếu thu/chi, giao dịch thiếu số chứng từ, giao dịch chưa đối chiếu và danh mục chi tiết gồm ngày, số chứng từ, diễn giải, hồ sơ, số tiền, tình trạng đối chiếu và số tệp đính kèm. Lưu tệp xuất cùng bộ chứng từ kiểm soát; báo cáo này là ảnh chụp dữ liệu tại thời điểm xuất.

Để đính kèm hóa đơn hoặc chứng từ cho một dòng thu–chi đã tạo, nhấn biểu tượng kẹp giấy tại cột **Tệp**. Hệ thống chấp nhận tệp **PDF, JPG, PNG và WEBP**, với dung lượng không quá **8 MB** mỗi tệp. Tệp được lưu theo từng giao dịch; có thể mở lại từ cửa sổ chứng từ đính kèm. Không tải lên tài liệu không liên quan đến giao dịch hoặc có dữ liệu nhạy cảm vượt quá phạm vi cần thiết cho chứng từ kế toán.

## Phân quyền theo email và ủy quyền chi tiết

Hệ thống có ba lớp vai trò: **chủ sở hữu**, **quản trị viên** và **nhân sự**. Chủ sở hữu được nhận diện bằng tài khoản dự án và có toàn quyền; vai trò này không thể được đổi từ giao diện. Quản trị viên không có toàn quyền mặc định mà chỉ được thực hiện đúng từng thẩm quyền chủ sở hữu cấp. Nhân sự có thể xem, tạo và chỉnh sửa nghiệp vụ thông thường nhưng không tự phê duyệt, khóa/mở kỳ, từ chối báo cáo hay xóa dữ liệu.

| Thao tác | Chủ sở hữu | Quản trị viên được ủy quyền | Nhân sự |
|---|---:|---:|---:|
| Xem dashboard, báo cáo và danh mục nghiệp vụ | Có | Có | Có |
| Tạo/chỉnh sửa hồ sơ, doanh thu, chi phí, thu–chi | Có | Có | Có |
| Gửi yêu cầu phê duyệt kỳ hoặc báo cáo | Có | Có | Có |
| Phê duyệt/từ chối kỳ, khóa hoặc mở lại kỳ | Có | Chỉ khi được cấp đúng quyền | Không |
| Phê duyệt báo cáo cấp 1 hoặc cấp 2; từ chối báo cáo | Có | Chỉ khi được cấp đúng quyền | Không |
| Xóa dữ liệu nghiệp vụ | Có | Chỉ khi được cấp quyền xóa | Không |
| Mời email, đổi vai trò và thay đổi quyền của người khác | Có | Không | Không |

### Mời tài khoản và kích hoạt quyền

1. Chủ sở hữu mở mục **Phân quyền truy cập** và nhập email công việc của người được mời.
2. Chọn vai trò **Quản trị viên** hoặc **Nhân sự**. Với quản trị viên, chỉ chọn những quyền thực sự cần thiết trong danh mục quyền có thể ủy quyền.
3. Xác nhận mời. Hệ thống lưu lời mời, quyền dự kiến và nhật ký thao tác của chủ sở hữu; lời mời **không** làm phát sinh quyền ngay lập tức.
4. Người được mời đăng nhập bằng đúng email đã được mời. Hệ thống sẽ gắn vai trò và quyền đã cấp vào tài khoản tương ứng.
5. Chủ sở hữu kiểm tra lại khu vực **Người phê duyệt được ủy quyền** và nhật ký ủy quyền, đặc biệt trước khi sử dụng luồng báo cáo hai cấp.

| Quyền có thể cấp cho quản trị viên | Phạm vi sử dụng |
|---|---|
| Phê duyệt kỳ | Phê duyệt hoặc từ chối yêu cầu khóa sổ tháng của người khác. |
| Khóa sổ tháng | Khóa một kỳ đã được phê duyệt. |
| Mở lại kỳ | Mở kỳ đã khóa khi có lý do được ghi nhận. |
| Phê duyệt báo cáo cấp 1 | Kiểm tra báo cáo đã khóa ở bước xác nhận thứ nhất. |
| Phê duyệt báo cáo cấp 2 | Xác nhận hoàn tất ở bước thứ hai, độc lập với người lập và cấp 1. |
| Từ chối báo cáo | Trả lại yêu cầu báo cáo kèm lý do. |
| Xóa dữ liệu nghiệp vụ | Xóa hồ sơ, doanh thu, chi phí hoặc giao dịch thu–chi; chỉ cấp khi thật cần thiết. |

> Không dùng một tài khoản duy nhất cho người lập, người phê duyệt cấp 1 và cấp 2. Chủ sở hữu cần rà soát danh mục người phê duyệt trước mỗi kỳ để duy trì phân tách nhiệm vụ. Việc phân quyền và các thay đổi quyền được lưu trong nhật ký kiểm soát, nhưng không thay thế quy chế ủy quyền, phê duyệt hoặc lưu trữ hồ sơ nội bộ của Công ty.

## Nguyên tắc kiểm soát

Không dùng ngày thu tiền để thay thế cho ngày cung cấp dịch vụ hoặc ngày hóa đơn. Với từng dòng doanh thu và chi phí, nên ghi đầy đủ mã hồ sơ, số hóa đơn, ngày chứng từ, giá trị trước thuế, thuế GTGT và ghi chú hồ sơ. Các giao dịch trong nhật ký thu–chi nên được đánh dấu **Đã đối chiếu** chỉ sau khi khớp với sao kê ngân hàng hoặc sổ quỹ.

Khi cần hiệu chỉnh dữ liệu, ưu tiên cập nhật bản ghi hiện hữu thay vì xóa. Quyền xóa chỉ dành cho chủ sở hữu nhằm hạn chế rủi ro mất dữ liệu và duy trì khả năng kiểm tra nội bộ.

## Căn cứ và giới hạn áp dụng

Thông tư 133/2016/TT-BTC hướng dẫn nguyên tắc ghi sổ kế toán, lập và trình bày báo cáo tài chính đối với doanh nghiệp nhỏ và vừa; đồng thời nêu rõ thông tư không áp dụng để xác định nghĩa vụ thuế. Văn bản này cho phép doanh nghiệp thiết kế mẫu chứng từ và sổ kế toán phù hợp đặc điểm hoạt động nhưng phải bảo đảm thông tin đầy đủ, rõ ràng và dễ kiểm tra, kiểm soát. Với tiền, văn bản yêu cầu ghi chép liên tục theo trình tự phát sinh và đối chiếu với chứng từ quỹ/ngân hàng.[1]

> Veritas Finance Desk là công cụ quản trị và kiểm soát nội bộ. Báo cáo quý, 6 tháng và năm trong ứng dụng là **báo cáo quản trị**, không phải báo cáo tài chính, quyết toán thuế hoặc bộ hồ sơ nộp cơ quan nhà nước. Kế toán phụ trách phải xác nhận chế độ kế toán doanh nghiệp đang áp dụng, thời hạn nộp và biểu mẫu pháp lý hiện hành trước khi ký, kê khai hoặc nộp hồ sơ.

## Tài liệu tham khảo

[1]: https://thuvienphapluat.vn/van-ban/Doanh-nghiep/Thong-tu-133-2016-TT-BTC-huong-dan-che-do-ke-toan-doanh-nghiep-nho-va-vua-284997.aspx "Thông tư 133/2016/TT-BTC — hướng dẫn chế độ kế toán doanh nghiệp nhỏ và vừa"
