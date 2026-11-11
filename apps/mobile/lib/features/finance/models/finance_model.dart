class InvoiceModel {
  final String id;
  final String tenantId;
  final String studentId;
  final String? studentName;
  final String? studentNis;
  final String? classGroupName;
  final String billingCategoryId;
  final String? billingCategoryName;
  final String invoiceNumber;
  final String title;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final String status;
  final String dueDate;
  final String createdAt;

  InvoiceModel({
    required this.id,
    required this.tenantId,
    required this.studentId,
    this.studentName,
    this.studentNis,
    this.classGroupName,
    required this.billingCategoryId,
    this.billingCategoryName,
    required this.invoiceNumber,
    required this.title,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.status,
    required this.dueDate,
    required this.createdAt,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      studentId: json['studentId'] as String,
      studentName: json['studentName'] as String?,
      studentNis: json['studentNis'] as String?,
      classGroupName: json['classGroupName'] as String?,
      billingCategoryId: json['billingCategoryId'] as String,
      billingCategoryName: json['billingCategoryName'] as String?,
      invoiceNumber: json['invoiceNumber'] as String,
      title: json['title'] as String,
      totalAmount: (json['totalAmount'] as num).toDouble(),
      paidAmount: (json['paidAmount'] as num).toDouble(),
      remainingAmount: (json['remainingAmount'] as num).toDouble(),
      status: json['status'] as String,
      dueDate: json['dueDate'] as String,
      createdAt: json['createdAt'] as String,
    );
  }
}

class PaymentModel {
  final String id;
  final String invoiceId;
  final String? invoiceNumber;
  final String transactionCode;
  final double amountPaid;
  final String paymentMethod;
  final String paymentStatus;
  final String? receiptNumber;
  final String paidAt;

  PaymentModel({
    required this.id,
    required this.invoiceId,
    this.invoiceNumber,
    required this.transactionCode,
    required this.amountPaid,
    required this.paymentMethod,
    required this.paymentStatus,
    this.receiptNumber,
    required this.paidAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['id'] as String,
      invoiceId: json['invoiceId'] as String,
      invoiceNumber: json['invoiceNumber'] as String?,
      transactionCode: json['transactionCode'] as String,
      amountPaid: (json['amountPaid'] as num).toDouble(),
      paymentMethod: json['paymentMethod'] as String,
      paymentStatus: json['paymentStatus'] as String,
      receiptNumber: json['receiptNumber'] as String?,
      paidAt: json['paidAt'] as String,
    );
  }
}

class DigitalReceiptModel {
  final String receiptNumber;
  final String transactionCode;
  final String invoiceNumber;
  final String invoiceTitle;
  final String studentName;
  final String studentNis;
  final String? classGroupName;
  final double amountPaid;
  final double totalInvoiceAmount;
  final double remainingBalance;
  final String paymentMethod;
  final String paidAt;
  final String verificationHash;
  final String tenantName;

  DigitalReceiptModel({
    required this.receiptNumber,
    required this.transactionCode,
    required this.invoiceNumber,
    required this.invoiceTitle,
    required this.studentName,
    required this.studentNis,
    this.classGroupName,
    required this.amountPaid,
    required this.totalInvoiceAmount,
    required this.remainingBalance,
    required this.paymentMethod,
    required this.paidAt,
    required this.verificationHash,
    required this.tenantName,
  });

  factory DigitalReceiptModel.fromJson(Map<String, dynamic> json) {
    return DigitalReceiptModel(
      receiptNumber: json['receiptNumber'] as String,
      transactionCode: json['transactionCode'] as String,
      invoiceNumber: json['invoiceNumber'] as String,
      invoiceTitle: json['invoiceTitle'] as String,
      studentName: json['studentName'] as String,
      studentNis: json['studentNis'] as String,
      classGroupName: json['classGroupName'] as String?,
      amountPaid: (json['amountPaid'] as num).toDouble(),
      totalInvoiceAmount: (json['totalInvoiceAmount'] as num).toDouble(),
      remainingBalance: (json['remainingBalance'] as num).toDouble(),
      paymentMethod: json['paymentMethod'] as String,
      paidAt: json['paidAt'] as String,
      verificationHash: json['verificationHash'] as String,
      tenantName: json['tenantName'] as String,
    );
  }
}
