import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";

/**
 * PopularPosts Component
 * Shows ranking of most popular posts by interactions
 *
 * @param {Object} props
 * @param {Array} props.posts - Array of { post_id, title, totalScore }
 * @param {Array} props.rawResults - Raw analytics results for client-side filtering
 * @param {string} props.dateRange - Selected date range
 * @param {string} props.globalDateRange - Global date range from parent
 * @param {function} props.onDateRangeChange - Callback when date range changes
 * @param {function} props.filterResultsByDateRange - Function to filter results by date
 * @param {number} props.limit - Max posts to show (3 for free, 50 for pro)
 */
export default function PopularPosts({
    posts = [],
    rawResults = [],
    dateRange = "Last 30 Days",
    globalDateRange = "Last 30 Days",
    onDateRangeChange,
    filterResultsByDateRange,
    limit = 10
}) {
    // Standard date range options
    const standardDateRangeOptions = [
        { value: "Last 7 Days", label: __("Last 7 Days", "text-to-audio") },
        { value: "Last 30 Days", label: __("Last 30 Days", "text-to-audio") },
        { value: "Last 90 Days", label: __("Last 90 Days", "text-to-audio") },
    ];

    // Build dropdown options dynamically - add globalDateRange if not in standard options
    const dateRangeOptions = useMemo(() => {
        const options = [...standardDateRangeOptions];
        const globalOptionExists = standardDateRangeOptions.some(
            (option) => option.value === globalDateRange
        );
        if (!globalOptionExists && globalDateRange) {
            options.unshift({ value: globalDateRange, label: globalDateRange });
        }
        return options;
    }, [globalDateRange]);

    // TTS-247: data-driven, no demo data. Popular posts come from the free base
    // aggregator, so the real ranking renders for everyone.
    const filteredPosts = useMemo(() => {
        // If date range matches global, use the already fetched posts
        if (dateRange === globalDateRange) {
            return posts;
        }

        // Otherwise, filter and re-calculate from raw results
        if (filterResultsByDateRange && rawResults.length > 0) {
            const filtered = filterResultsByDateRange(rawResults, dateRange);

            // Aggregate by post_id
            const postScores = {};
            filtered.forEach((result) => {
                const postId = result.post_id;
                if (!postScores[postId]) {
                    postScores[postId] = { post_id: postId, title: null, totalScore: 0 };
                }
                const analytics = result.analytics || {};
                // Sum all interaction counts
                Object.keys(analytics).forEach((key) => {
                    if (analytics[key]?.count) {
                        postScores[postId].totalScore += analytics[key].count;
                    }
                });
            });

            // Convert to array and sort by score
            return Object.values(postScores)
                .sort((a, b) => b.totalScore - a.totalScore);
        }

        return posts;
    }, [posts, rawResults, dateRange, globalDateRange, filterResultsByDateRange]);

    // Use filtered posts
    const displayPosts = filteredPosts;

    // TTS-247: show the real ranking up to the display limit — no free-tier cap.
    const displayLimit = Math.min(limit, 50);
    const postsToShow = displayPosts.slice(0, displayLimit);
    const hasMore = displayPosts.length > displayLimit;

    // Truncate title
    const truncateTitle = (title, maxLength = 35) => {
        if (!title) return `Post #${Math.random().toString(36).substr(2, 5)}`;
        if (title.length <= maxLength) return title;
        return title.substring(0, maxLength) + "...";
    };

    const content = (
        <div className="tta_analytics_card tta_popular_posts_card">
            <div className="tta_card_header">
                <h3 className="tta_section_title">{__("Popular Post", "text-to-audio")}</h3>
                <Form.Select
                    className="tta_date_select"
                    value={dateRange}
                    onChange={(e) => onDateRangeChange && onDateRangeChange(e.target.value)}
                    size="sm"
                >
                    {dateRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
            </div>

            <div className="tta_popular_table">
                {/* Header */}
                <div className="tta_table_row tta_popular_header_row">
                    <div className="tta_table_cell">{__("Rank", "text-to-audio")}</div>
                    <div className="tta_table_cell">{__("Post Title", "text-to-audio")}</div>
                    <div className="tta_table_cell">{__("Total Interactions", "text-to-audio")}</div>
                </div>

                {/* Posts */}
                {postsToShow.map((post, index) => (
                    <div
                        key={`popular-${post.post_id}-${index}`}
                        className={`tta_table_row ${index < 3 ? "tta_top_post" : ""}`}
                    >
                        <div className="tta_table_cell tta_rank_cell">
                            <span className={`tta_rank_badge ${index < 3 ? `tta_rank_${index + 1}` : ""}`}>
                                #{index + 1}
                            </span>
                        </div>
                        <div className="tta_table_cell tta_title_cell">
                            {truncateTitle(post.title)}
                        </div>
                        <div className="tta_table_cell tta_score_cell">
                            {post.totalScore.toLocaleString()}
                        </div>
                    </div>
                ))}

                {/* Empty state */}
                {postsToShow.length === 0 && (
                    <div className="tta_empty_state">
                        <p>{__("No data available yet. Start tracking posts to see analytics.", "text-to-audio")}</p>
                    </div>
                )}
            </div>

            {/* View all indicator when there are more ranked posts than shown */}
            {hasMore && (
                <div className="tta_popular_more">
                    <button
                        className="tta_view_all_btn"
                        onClick={() => {/* Could open modal with all posts */}}
                    >
                        {__("View All Posts", "text-to-audio")} →
                    </button>
                </div>
            )}
        </div>
    );

    return content;
}
