#pragma once

namespace sead {
class TextWriter;
}

namespace uks::screen {


void Init();
void Compute();
void Render(sead::TextWriter*);
}