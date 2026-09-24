// Browser page translation (Chrome's built-in Google Translate, Edge, etc.)
// swaps the text React rendered for its own <font> wrappers. When React later
// updates that text it removes or inserts next to a node that is no longer
// where it left it, and the whole screen crashes with "Failed to execute
// 'removeChild' on 'Node'" (facebook/react#11538). Many site owners translate
// the admin this way, so skip those two impossible DOM calls instead of
// throwing. Only calls that would throw anyway change; everything else runs
// the original method. Pro's dashboard loads after this bundle on the same
// page, so it is covered too.
(function () {
    if (typeof Node !== 'function' || !Node.prototype || Node.prototype.__atlasVoiceTranslationGuard) {
        return;
    }
    Node.prototype.__atlasVoiceTranslationGuard = true;

    const removeChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
        if (child && child.parentNode !== this) {
            return child;
        }
        return removeChild.apply(this, arguments);
    };

    const insertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
            return newNode;
        }
        return insertBefore.apply(this, arguments);
    };
})();
