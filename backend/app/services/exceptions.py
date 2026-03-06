class AppError(Exception):
    pass

class UserAlreadyExistsError(AppError):
    pass

class InvalidVerificationCodeError(AppError):
    pass