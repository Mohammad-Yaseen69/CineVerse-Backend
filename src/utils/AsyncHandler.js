const asyncHandler = fn => (req, res, next) => {
    fn(req, res, next).catch(error => {
        console.error(error);
        res.status(error.statusCode || 500).json({
            message: error.message || "Internal Server Error",
            success: false,
            errors: error.errors || []
        });
    });
};

export { asyncHandler };