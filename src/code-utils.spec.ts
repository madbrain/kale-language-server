
import { expect } from 'chai';

import { code } from './code-utils';

describe("Code Utils Tests", function () {

    it("test code simple markers", function () {
        const content = code("@{1}256@{2}");
        expect(content.value).to.eql("256");
        expect(content.span(1, 2)).to.eql({
            from: {
                offset: 0,
                line: 0,
                character: 0
            }, to: {
                offset: 3,
                line: 0,
                character: 3
            }
        });
    });

    it("test code markers with newlines", function () {
        const content = code("@{1}256@{2} :=\n@{3}12@{4}");
        expect(content.value).to.eql("256 :=\n12");
        expect(content.span(1, 2)).to.eql({
            from: {
                offset: 0,
                line: 0,
                character: 0
            }, to: {
                offset: 3,
                line: 0,
                character: 3
            }
        });
        expect(content.span(3, 4)).to.eql({
            from: {
                offset: 7,
                line: 1,
                character: 0
            }, to: {
                offset: 9,
                line: 1,
                character: 2
            }
        });
    });
});