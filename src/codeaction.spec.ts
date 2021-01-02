

import { expect } from 'chai';

import { code } from './code-utils';
import { findCodeActions } from './codeaction';

describe("Code actions", function() {

    it("action to remove unused variable", function() {
        const content = code('@{1}price := @{3}10@{2}@{4}\nmessage := "hello"');
        const selectedSpan = content.span(3, 4);
        const actions = findCodeActions(content.value, selectedSpan);

        expect(actions).to.eql([{span: content.span(1, 2), title: "Remove unused definition", newText: "" }]);
    });

    it("no actions when no ovelaping hints", function() {
        const content = code('@{1}price := 10@{2}\nmessage @{3}:= "hello"@{4}');
        const selectedSpan = content.span(3, 4);
        const actions = findCodeActions(content.value, selectedSpan);

        expect(actions).to.empty;
    });
});