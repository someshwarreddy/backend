
const User = require('../models/user.model');

exports.getUserReports = async (req, res) => {
    try {
        const [totalUsers, activeUsers, legacyUsers, pendingUsers, usersByRole, registrationsOverTime] =
            await Promise.all([
                User.countDocuments(),
                User.countDocuments({ status: 'active' },),
                User.countDocuments({ status: { $exists: false } }),
                User.countDocuments({ status: 'pending' }),
                User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                User.aggregate([
                    {
                        $match: {
                            createdAt: { $exists: true, $ne: null }
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: '%Y-%m-%d',
                                    date: '$createdAt'
                                }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ])

            ]);

        res.status(200).json({
            totalUsers,
            activeUsers,
            legacyUsers,
            pendingUsers,
            usersByRole,
            registrationsOverTime
        });

    } catch (error) {
        console.error('User reports error:', error);

        res.status(500).json({
            message: 'Failed to fetch user reports'
        });
    }
};
