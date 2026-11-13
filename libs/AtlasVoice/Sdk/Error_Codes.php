<?php
/**
 * AtlasVoice SDK: the error codes of the service.
 *
 * @package AtlasVoice\Sdk
 */

namespace AtlasVoice\Sdk;

/**
 * Error codes are part of the service's contract: a code is added, never
 * renamed. Callers compare against these constants, so a typing mistake is
 * found when the code is written, not on a customer's site.
 *
 * A code this list does not know is still passed on as it came; a caller
 * treats an unknown code as "the service could not do this".
 */
final class Error_Codes {

	// The key.
	const MISSING_API_KEY   = 'missing_api_key';
	const INVALID_API_KEY   = 'invalid_api_key';
	const SUSPENDED         = 'suspended';
	const APPROVAL_REQUIRED = 'approval_required';
	const APPROVAL_PENDING  = 'approval_pending';

	// Limits.
	const RATE_LIMITED   = 'rate_limited';
	const QUOTA_EXCEEDED = 'quota_exceeded';
	const DAILY_LIMIT    = 'daily_limit';

	// The text.
	const TEXT_TOO_LONG        = 'text_too_long';
	const EMPTY_TEXT           = 'empty_text';
	const NOTHING_TO_SPEAK     = 'nothing_to_speak';
	const UNSUPPORTED_LANGUAGE = 'unsupported_language';

	// The engine.
	const UNKNOWN_ENGINE     = 'unknown_engine';
	const ENGINE_NOT_IN_PLAN = 'engine_not_in_plan';

	// The service itself.
	const SERVER_BUSY         = 'server_busy';
	const SERVICE_UNAVAILABLE = 'service_unavailable';

	// Licences and projects.
	const LICENSE_QUOTA_REACHED      = 'license_quota_reached';
	const LICENSE_NOT_ACTIVE_ON_SITE = 'license_not_active_on_site';
	const LICENSE_CHECK_UNAVAILABLE  = 'license_check_unavailable';
	const PROJECT_EXISTS             = 'project_exists';

	/**
	 * Set by the SDK, not by the service: no answer came (network, DNS, TLS,
	 * timeout), or the answer could not be read.
	 */
	const UNREACHABLE = 'service_unreachable';

	/**
	 * Codes after which waiting and trying again later can help.
	 */
	const TEMPORARY = array(
		self::RATE_LIMITED,
		self::SERVER_BUSY,
		self::SERVICE_UNAVAILABLE,
		self::LICENSE_CHECK_UNAVAILABLE,
		self::UNREACHABLE,
	);
}
