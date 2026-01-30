import React, { useMemo } from "react";
import { __ } from "@wordpress/i18n";
import { Form } from "react-bootstrap";
import ProFeatureOverlay from "./ProFeatureOverlay";

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
    limit = 3
}) {
    const isProActive = typeof ttsObj !== "undefined" && ttsObj.is_pro_active;

    // Demo data
    const demoPosts = [
        { post_id: 1, title: "Exploring the Wonders of Nature", totalScore: 310 },
        { post_id: 2, title: "The Art of Mindful Living", totalScore: 223 },
        { post_id: 3, title: "Tech Innovations Shaping Our Future", totalScore: 38 },
        { post_id: 4, title: "Culinary Adventures: A Taste of Italy", totalScore: 22 },
        { post_id: 5, title: "Fitness Trends to Watch in 2024", totalScore: 9 },
        { post_id: 6, title: "Travel Diaries: Hidden Gems Around the...", totalScore: 8 },
        { post_id: 7, title: "Sustainable Fashion: Dressing with Purp...", totalScore: 7 },
        { post_id: 8, title: "The Power of Positive Thinking", totalScore: 6 },
        { post_id: 9, title: "Home Decor Ideas for a Cozy Space", totalScore: 4 },
        { post_id: 10, title: "Mastering the Art of Photography", totalScore: 3 },
    ];

    // Filter and calculate popular posts based on component's date range
    const filteredPosts = useMemo(() => {
        if (!isProActive) return posts.length > 0 ? posts : demoPosts;

        // If date range matches global, use the already fetched posts
        if (dateRange === globalDateRange) {
            return posts.length > 0 ? posts : demoPosts;
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

        return posts.length > 0 ? posts : demoPosts;
    }, [posts, rawResults, dateRange, globalDateRange, filterResultsByDateRange, isProActive]);

    // Use filtered posts
    const displayPosts = filteredPosts;

    // Apply limit for free version (3 for free, 10 default for pro)
    const displayLimit = isProActive ? Math.min(limit, 50) : 3;
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
                    <option value="Last 7 Days">{__("Last 7 Days", "text-to-audio")}</option>
                    <option value="Last 30 Days">{__("Last 30 Days", "text-to-audio")}</option>
                    <option value="Last 90 Days">{__("Last 90 Days", "text-to-audio")}</option>
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

            {/* More posts indicator */}
            {hasMore && !isProActive && (
                <div className="tta_popular_more">
                    <a
                        href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tta_view_more_link"
                    >
                        {__("View all", "text-to-audio")} {displayPosts.length} {__("posts", "text-to-audio")} ({__("Pro", "text-to-audio")}) →
                    </a>
                </div>
            )}

            {/* View all link for pro users */}
            {isProActive && displayPosts.length > displayLimit && (
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

    // For free users, show limited version without overlay
    // The overlay is only for completely locked features
    return content;
}
