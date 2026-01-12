import React, { useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import UpgradeToPro from "../../UpgradeToPro";
import { postWithoutImage } from "../../context/utilities";
import { MultiSelect } from "../../context/MultiSelect";
import notify from "../../context/Notify";
import toast from "../../context/Notify";
import AtlasVoicePlayerInsights from "../../../../../admin/js/AtlasVoicePlayerInsights";

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    tts_enable_analytics: false,
    tts_trackable_post_ids: [],
  });
  const [postIds, setPostIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [summary, setSummary] = useState({});
  const [mostPopularPosts, setMostPopularPosts] = useState({});
  const [popularPostsIds, setPopularPostsIds] = useState([]);
  const [analyticsSearch, setAnalyticsSearch] = useState({});

  function getTotalTime(totalSeconds) {
    let output = totalSeconds / 60;
    let summeryString = " Minute";

    if (output > 1) {
      summeryString = " Minutes";
    }

    if (output > 60) {
      summeryString = " Hour";
      output = output / 60;
      if (output > 1) {
        summeryString = " Hours";
      }
    }

    output = output.toFixed(2);
    output += summeryString;
    return output;
  }

  function summarizeAnalytics(data) {
    const summary = {
      totalPosts: data.length,
      totalCounts: {
        init: 0,
        play: 0,
        time: 0,
        pause: 0,
        download: 0,
        end: 0,
      },
      totalInteractions: 0,
    };

    data.forEach((entry) => {
      const events = entry.analytics;
      for (const event in events) {
        if (summary.totalCounts.hasOwnProperty(event)) {
          summary.totalCounts[event] += events[event].count;
        }
      }
    });

    summary.totalCounts.time = getTotalTime(summary.totalCounts.time);
    const totalCounts = Object.values(summary.totalCounts);
    summary.totalInteractions = totalCounts.reduce((acc, val, currentIndex) => {
      if (currentIndex === 2) {
        return acc;
      }
      return acc + val;
    }, 0);

    return summary;
  }

  function getPopularPosts(data) {
    return data
      .map((post) => {
        const { post_id, analytics } = post;
        const totalScore = Object.values(analytics).reduce((sum, event) => {
          if (event?.count) {
            return sum + event.count;
          }
          return sum;
        }, 0);
        return { post_id, totalScore };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  }

  useEffect(() => {
    let formData = new FormData();
    formData.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/latest_posts", formData).then(
      (res) => {
        setPostIds(res.data);
      }
    );

    let formData2 = new FormData();
    formData2.append("method", "get");
    postWithoutImage(tta_obj.api_url + "tta/v1/all_insights", formData).then(
      (res) => {
        const summary = summarizeAnalytics(res.data);
        setSummary(summary);

        const popularPosts = getPopularPosts(res.data);
        setMostPopularPosts(popularPosts);

        const post_ids = [...new Set(popularPosts.map((item) => item.post_id))];
        setPopularPostsIds(post_ids);
      }
    );
  }, []);

  useEffect(() => {
    if (popularPostsIds.length) {
      let formData = new FormData();
      formData.append("method", "post");
      formData.append("ids", JSON.stringify(popularPostsIds));
      postWithoutImage(tta_obj.api_url + "tta/v1/latest_posts", formData).then(
        (res) => {
          let postsWithTitle = res.data;
          let postsData = structuredClone(mostPopularPosts);
          postsData.map((post) => {
            post.title = postsWithTitle[post.post_id];
            return post;
          });
          setMostPopularPosts(postsData);
        }
      );
    }
  }, [popularPostsIds]);

  useEffect(() => {
    if (Object.keys(postIds).length) {
      let formData = new FormData();
      formData.append("method", "get");
      postWithoutImage(
        tta_obj.api_url + "tta/v1/get_analytics_settings",
        formData
      )
        .then((res) => {
          setAnalytics({
            ...analytics,
            ...res.data,
          });
          setSelectedIds(res.data.tts_trackable_post_ids);
          setIsDataLoaded(true);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [postIds]);

  const handleSelectionChange = (selectedIds) => {
    setSelectedIds(selectedIds);
  };

  const handleChange = (e) => {
    let value = "";
    if (e.target.getAttribute("type") === "checkbox") {
      value = e.target.checked;
    }

    if (!e.target.name) return;

    setAnalytics({
      ...analytics,
      ...{ [e.target.name]: value },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    analytics.tts_trackable_post_ids = selectedIds;
    let formData = new FormData();
    formData.append("analytics", JSON.stringify(analytics));
    formData.append("method", "post");
    postWithoutImage(
      tta_obj.api_url + "tta/v1/save_analytics_settings",
      formData
    )
      .then((res) => {
        if (res?.data) {
          setAnalytics({
            ...analytics,
            ...res.data,
          });
        }
        toast("Successfully Saved.", "info", {
          autoClose: 2500,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSearchData = (e) => {
    e.preventDefault();
    let searchedData = structuredClone(analyticsSearch);
    if (!ttsObj.is_pro_active) {
      if (e.target.name === "from_date" || e.target.name === "to_date") {
        notify(
          <>
            <h6>Date Range is only available in pro version</h6>
            <button
              onClick={(e) => {
                window.open(
                  "https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                );
              }}
              className="tta_btn"
            >
              Buy Now
            </button>
          </>,
          "info",
          {
            position: "top-right",
            autoClose: 10000,
          }
        );
        return;
      }
    }
    let tempData = {
      ...searchedData,
      [e.target.name]: e.target.value,
    };

    setAnalyticsSearch(tempData);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    let error_message = "";

    if (
      !analyticsSearch.post_id &&
      !(analyticsSearch.from_date || analyticsSearch.to_date)
    ) {
      error_message = "Please provide either a Post ID or a date range.";
    }

    if (error_message) {
      notify(error_message, "error");
      return;
    }

    let insight = new AtlasVoicePlayerInsights(analyticsSearch, "dashboard");
  };

  // Custom Toggle Switch Component
  const ToggleSwitch = ({ checked, onChange, name, id, disabled }) => (
    <label className={`custom-switch ${disabled ? "switch-disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        id={id}
        disabled={disabled}
      />
      <span className="switch-track">
        <span className="switch-thumb"></span>
      </span>
    </label>
  );

  return isDataLoaded ? (
    <React.Fragment>
      <Container fluid>
        <Row>
          <Col xs={12} lg={8}>
            {/* Analytics Header Card */}
            <div className="tta_analytics_header_card">
              <div className="tta_analytics_header_content">
                <div className="tta_analytics_header_left">
                  <h2 className="tta_analytics_title">Analytics</h2>
                  <ToggleSwitch
                    checked={analytics.tts_enable_analytics}
                    onChange={handleChange}
                    name="tts_enable_analytics"
                    id="tts_enable_analytics"
                  />
                </div>
                <div className="tta_analytics_header_right">
                  <span className="tta_date_badge">Dec 02 - Dec 24, 2025</span>
                </div>
              </div>
              <p className="tta_analytics_subtitle">
                Here a short text have to write to inform the user about this
                feature purpose
              </p>
            </div>

            <Form onSubmit={handleSubmit}>
              {/* TTS Player Analytics Summary */}
              {Object.keys(summary).length > 0 && (
                <div className="tta_summary_card">
                  <div className="tta_summary_header">
                    <div className="tta_summary_header_left">
                      <h3 className="tta_summary_title">
                        TTS Player Analytics Summary
                      </h3>
                      <span className="tta_total_interactions_badge">
                        🔥 Total Interactions: {summary.totalInteractions}K
                      </span>
                    </div>
                    <span className="tta_timeframe_badge">Last 7 Days</span>
                  </div>

                  <div className="tta_stat_cards_container">
                    <div className="tta_stat_card tta_stat_posts">
                      <div className="tta_stat_label">Total Posts</div>
                      <div className="tta_stat_value">{summary.totalPosts}K</div>
                    </div>
                    <div className="tta_stat_card tta_stat_init">
                      <div className="tta_stat_label">Init</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.init}K
                      </div>
                    </div>
                    <div className="tta_stat_card tta_stat_play">
                      <div className="tta_stat_label">Play</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.play}K
                      </div>
                    </div>
                    <div className="tta_stat_card tta_stat_time">
                      <div className="tta_stat_label">Time (Min)</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.time}
                      </div>
                    </div>
                    <div className="tta_stat_card tta_stat_pause">
                      <div className="tta_stat_label">Pause</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.pause}K
                      </div>
                    </div>
                    <div className="tta_stat_card tta_stat_download">
                      <div className="tta_stat_label">Download</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.download}K
                      </div>
                    </div>
                    <div className="tta_stat_card tta_stat_end">
                      <div className="tta_stat_label">End</div>
                      <div className="tta_stat_value">
                        {summary.totalCounts.end}K
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Section - OS, Device Types, Location, Playing Trend */}
              <div className="tta_charts_section">
                <div id="atlasVoice_analytics"></div>
              </div>

              {/* Track Post IDs and Popular Posts */}
              <div className="tta_bottom_section">
                <div className="tta_track_posts_card">
                  <div className="tta_card_header">
                    <h3 className="tta_section_title">Track Post IDs</h3>
                    <span className="tta_date_range_small">
                      Dec 27, - Jan 03, 2025
                    </span>
                  </div>

                  <div className="tta_multiselect_wrapper">
                    <Form.Label className="tta_form_label">
                      all{" "}
                      <span className="tta_remove_tag">×</span>
                    </Form.Label>
                    <MultiSelect
                      toastMessage="Tracking more than 5 post IDs is a pro feature"
                      name="tts_trackable_post_ids"
                      id="tts_trackable_post_ids"
                      selectedItems={selectedIds}
                      selectionLimit={5}
                      options={postIds}
                      onChange={handleSelectionChange}
                    />
                  </div>

                  <div className="tta_search_section">
                    <Form.Control
                      type="number"
                      name="post_id"
                      placeholder="Post ID"
                      value={analyticsSearch?.post_id || ""}
                      onChange={handleSearchData}
                      className="tta_search_input"
                    />
                    <div className="tta_date_inputs">
                      <Form.Control
                        type="date"
                        name="from_date"
                        value={analyticsSearch?.from_date || ""}
                        onChange={handleSearchData}
                        className="tta_search_input"
                      />
                      <Form.Control
                        type="date"
                        name="to_date"
                        value={analyticsSearch?.to_date || ""}
                        onChange={handleSearchData}
                        className="tta_search_input"
                      />
                    </div>
                    <Button onClick={handleSearch} className="tta_search_btn">
                      Search
                    </Button>
                  </div>

                  {/* Metrics Table */}
                  <div className="tta_metrics_table">
                    <div className="tta_table_row tta_table_header_row">
                      <div className="tta_table_cell">Metric</div>
                      <div className="tta_table_cell">Value</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalinit</div>
                      <div className="tta_table_cell">14</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalPlay</div>
                      <div className="tta_table_cell">8</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalPause</div>
                      <div className="tta_table_cell">4</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalTime</div>
                      <div className="tta_table_cell">0.75 Minute</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalEnd</div>
                      <div className="tta_table_cell">7</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">totalDownload</div>
                      <div className="tta_table_cell">1</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">averagePlayClickRatio</div>
                      <div className="tta_table_cell">57.4%</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">
                        averageListenTillEndRatio
                      </div>
                      <div className="tta_table_cell">87.50%</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">
                        averageListeningTimePerPlay
                      </div>
                      <div className="tta_table_cell">5.63 Seconds</div>
                    </div>
                    <div className="tta_table_row">
                      <div className="tta_table_cell">averagePausesPerPlay</div>
                      <div className="tta_table_cell">0.50</div>
                    </div>
                  </div>
                </div>

                <div className="tta_popular_posts_card">
                  <div className="tta_card_header">
                    <h3 className="tta_section_title">Popular Post</h3>
                    <span className="tta_date_range_small">Last 30 Days</span>
                  </div>

                  {ttsObj.is_pro_active ? (
                    mostPopularPosts.length > 0 && (
                      <div className="tta_popular_table">
                        <div className="tta_table_row tta_popular_header_row">
                          <div className="tta_table_cell">Rank</div>
                          <div className="tta_table_cell">Post Title</div>
                          <div className="tta_table_cell">
                            Total Interactions
                          </div>
                        </div>
                        {mostPopularPosts.map((post, index) => (
                          <div key={post.post_id} className="tta_table_row">
                            <div className="tta_table_cell">#{index + 1}</div>
                            <div className="tta_table_cell">{post.title}</div>
                            <div className="tta_table_cell">
                              {post.totalScore}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="tta_pro_notice">
                      <p>
                        To see popular post analytics you have to upgrade to{" "}
                        <a
                          href="https://atlasaidev.com/plugins/text-to-speech-pro/pricing/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tta_pro_link"
                        >
                          pro version
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="tta_save_button_wrapper">
                <Button type="submit" className="tta_btn">
                  Save
                </Button>
              </div>
            </Form>
          </Col>

          <Col xs={12} lg={4}>
            <UpgradeToPro promotionType="analytics" />
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  ) : (
    <div className="tta_loading_container">
      <h1>Loading...</h1>
    </div>
  );
}